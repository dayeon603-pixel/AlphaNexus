"""
IPScope FastAPI application.

Endpoints:
    GET  /         → HTML input form
    POST /analyze  → full pipeline → HTML traffic-light report
    GET  /health   → {"status": "ok"}
    GET  /info     → app metadata, module list, weights, data source
"""

import logging
import os
from typing import Annotated, Any

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse

from app.cache import AnalysisCache
from app.kipris_client import KiprisClient
from app.pipeline import APP_NAME, APP_VERSION, GRADE_THRESHOLDS, PATENT_MODULE_WEIGHTS, run_pipeline

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="IP portfolio risk-screening tool. Mock mode by default; set KIPRIS_SERVICE_KEY for live data.",
)

_kipris_client = KiprisClient(mode="auto")
_cache = AnalysisCache()

DATA_SOURCE: str = f"KIPRIS ({_kipris_client.mode})"

# ---------------------------------------------------------------------------
# HTML templates (inline — no Jinja2 dependency)
# ---------------------------------------------------------------------------

_CSS = """
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:960px;margin:40px auto;padding:0 24px;color:#1a1a2e;background:#f7f8fc}
h1{color:#0f3460;margin-bottom:4px}
h2{color:#16213e;margin-top:32px}
.subtitle{color:#6c757d;font-size:14px;margin-bottom:32px}
.card{background:#fff;border-radius:12px;padding:24px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,.07)}
.badge-high{background:#dc3545;color:#fff;border-radius:6px;padding:4px 12px;font-weight:700;font-size:18px}
.badge-med{background:#fd7e14;color:#fff;border-radius:6px;padding:4px 12px;font-weight:700;font-size:18px}
.badge-low{background:#28a745;color:#fff;border-radius:6px;padding:4px 12px;font-weight:700;font-size:18px}
.score-big{font-size:42px;font-weight:800;color:#0f3460}
.ci{font-size:13px;color:#6c757d;margin-left:8px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#0f3460;color:#fff;padding:10px 12px;text-align:left}
td{padding:9px 12px;border-bottom:1px solid #e9ecef}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f0f4ff}
.basis{font-size:11px;color:#888;max-width:260px;line-height:1.4}
.completeness-bar-outer{background:#e9ecef;border-radius:4px;height:8px;width:120px;display:inline-block;vertical-align:middle}
.completeness-bar-inner{background:#28a745;border-radius:4px;height:8px}
.weight-tag{background:#e8f4f8;color:#0f3460;border-radius:4px;padding:2px 6px;font-size:12px;font-weight:600;margin-right:4px}
.disclaimer{font-size:12px;color:#999;margin-top:32px;padding-top:16px;border-top:1px solid #e9ecef}
.form-card{background:#fff;border-radius:12px;padding:32px;margin:32px 0;box-shadow:0 2px 8px rgba(0,0,0,.07)}
input[type=text]{width:100%;padding:10px 14px;font-size:16px;border:1px solid #ced4da;border-radius:6px;box-sizing:border-box;margin-bottom:16px}
button{background:#0f3460;color:#fff;padding:10px 28px;font-size:16px;border:none;border-radius:6px;cursor:pointer}
button:hover{background:#16213e}
"""

_FORM_HTML = """<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>IPScope — IP 포트폴리오 리스크 스크리닝</title>
<style>{css}</style></head>
<body>
<h1>IPScope</h1>
<p class="subtitle">IP 포트폴리오 리스크 스크리닝 | Patent & Trademark Risk Analyzer</p>
<div class="form-card">
  <h2 style="margin-top:0">출원인 분석</h2>
  <form method="post" action="/analyze">
    <input type="text" name="applicant_name" placeholder="출원인명 입력 (예: 삼정테크 (주))" required>
    <button type="submit">포트폴리오 분석 시작</button>
  </form>
  <p style="margin-top:16px;font-size:13px;color:#888">
    Demo 출원인: <strong>삼정테크 (주)</strong>, 넥스테크 코리아, 글로벌IP홀딩스, 한국대학교 기술지주, 구형특허조합, 박민준 (개인)
  </p>
</div>
<div class="disclaimer">
  IPScope MVP — mock KIPRIS data. Set <code>KIPRIS_SERVICE_KEY</code> env var for live data.
  Scores are probabilistic estimates, not legal advice.
</div>
</body></html>"""


def _completeness_bar(value: float) -> str:
    pct = int(value * 100)
    return (
        f'<div class="completeness-bar-outer">'
        f'<div class="completeness-bar-inner" style="width:{pct}%"></div>'
        f'</div>&nbsp;{pct}%'
    )


def _badge(grade: str) -> str:
    cls = {"HIGH": "badge-high", "MED": "badge-med", "LOW": "badge-low"}.get(grade, "badge-low")
    return f'<span class="{cls}">{grade}</span>'


def _module_row(name: str, result: dict[str, Any], weight: float) -> str:
    score = result["score"]
    basis = result["basis"]
    comp = result["completeness"]
    ci_lo, ci_hi = (None, None)
    # No per-module CI in the row — we show it at patent level
    return (
        f"<tr><td>{name}</td>"
        f"<td><strong>{score:.1f}</strong></td>"
        f"<td><span class='weight-tag'>{weight:.0%}</span></td>"
        f"<td>{_completeness_bar(comp)}</td>"
        f"<td class='basis'>{basis}</td></tr>"
    )


def _render_report(result: dict[str, Any]) -> str:
    """Render full HTML traffic-light report from pipeline result dict."""
    grade = result["grade"]
    score = result["portfolio_score"]
    ci = result["ci"]
    applicant = result["applicant"]
    completeness = result["overall_completeness"]
    weights = result["weights"]

    # Per-patent table
    patent_rows = ""
    for pa in result["patent_analyses"]:
        patent_rows += f"""
        <tr>
          <td><strong>{pa['id']}</strong><br><span style="color:#888;font-size:11px">{pa['title']}</span></td>
          <td>{pa['scores'].get('dispute', 0):.1f}</td>
          <td>{pa['scores'].get('invalidation', 0):.1f}</td>
          <td>{pa['scores'].get('expiry', 0):.1f}</td>
          <td><strong>{pa['aggregate']:.1f}</strong></td>
          <td class="ci">[{pa['ci'][0]:.1f}, {pa['ci'][1]:.1f}]</td>
          <td>{_completeness_bar(pa['completeness'])}</td>
        </tr>
        <tr style="background:#fafbff">
          <td colspan="7" style="padding:4px 12px 10px 12px">
            <span style="font-size:11px;color:#888">
              <strong>Dispute:</strong> {pa['module_results']['dispute']['basis']}<br>
              <strong>Invalidation:</strong> {pa['module_results']['invalidation']['basis']}<br>
              <strong>Expiry:</strong> {pa['module_results']['expiry']['basis']}
            </span>
          </td>
        </tr>"""

    # Per-trademark table
    tm_rows = ""
    for tm in result["trademark_analyses"]:
        tm_rows += f"""
        <tr>
          <td><strong>{tm['id']}</strong><br><span style="color:#888;font-size:11px">{tm['title']}</span></td>
          <td colspan="3">{tm['scores'].get('trademark', 0):.1f}</td>
          <td><strong>{tm['aggregate']:.1f}</strong></td>
          <td class="ci">[{tm['ci'][0]:.1f}, {tm['ci'][1]:.1f}]</td>
          <td>{_completeness_bar(tm['completeness'])}</td>
        </tr>
        <tr style="background:#fafbff">
          <td colspan="7" style="padding:4px 12px 10px 12px">
            <span style="font-size:11px;color:#888">
              <strong>Trademark:</strong> {tm['module_results']['trademark']['basis']}
            </span>
          </td>
        </tr>"""

    no_ip_msg = ""
    if not result["patent_analyses"] and not result["trademark_analyses"]:
        no_ip_msg = "<p style='color:#dc3545'>해당 출원인의 IP 데이터가 없습니다.</p>"

    weight_breakdown = " ".join(
        f'<span class="weight-tag">{k.capitalize()} {v:.0%}</span>'
        for k, v in weights.items()
    )

    return f"""<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>IPScope 분석 결과 — {applicant}</title>
<style>{_CSS}</style></head>
<body>
<h1>IPScope 분석 결과</h1>
<p class="subtitle">출원인: <strong>{applicant}</strong></p>

<div class="card">
  <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
    <div>
      <div style="font-size:13px;color:#888;margin-bottom:4px">포트폴리오 리스크 점수</div>
      <span class="score-big">{score:.1f}</span>
      <span class="ci">/ 100 &nbsp; 90% CI [{ci[0]:.1f}, {ci[1]:.1f}]</span>
    </div>
    <div>
      <div style="font-size:13px;color:#888;margin-bottom:8px">등급</div>
      {_badge(grade)}
    </div>
    <div>
      <div style="font-size:13px;color:#888;margin-bottom:4px">데이터 완결성</div>
      {_completeness_bar(completeness)}
    </div>
  </div>
  <div style="margin-top:16px;font-size:13px;color:#555">
    특허 {result['patent_count']}건 · 상표 {result['trademark_count']}건 분석
  </div>
  <div style="margin-top:8px;font-size:13px;color:#555">
    가중치: {weight_breakdown}
    <span style="color:#888">(집중도 페널티 포함 — Herfindahl 조정)</span>
  </div>
</div>

{no_ip_msg}

{"<h2>특허 상세 분석</h2><table><thead><tr><th>특허번호 / 명칭</th><th>분쟁리스크</th><th>무효리스크</th><th>만료리스크</th><th>통합점수</th><th>90% CI</th><th>완결성</th></tr></thead><tbody>" + patent_rows + "</tbody></table>" if patent_rows else ""}

{"<h2>상표 상세 분석</h2><table><thead><tr><th>상표번호 / 명칭</th><th colspan='3'>상표리스크</th><th>점수</th><th>90% CI</th><th>완결성</th></tr></thead><tbody>" + tm_rows + "</tbody></table>" if tm_rows else ""}

<div class="card" style="margin-top:32px">
  <h2 style="margin-top:0">방법론 공개</h2>
  <p style="font-size:13px;color:#555">
    본 스크리닝 도구는 AlphaNexus 퀀트 엔진에서 포팅된 로지스틱 포화 함수(saturate)와
    헤르핀달 집중도 페널티를 IP 리스크 신호에 적용합니다.<br><br>
    <strong>분쟁리스크:</strong> Lanjouw &amp; Schankerman (2001) — 인용 역U형 관계, 패밀리 규모, 청구항 범위<br>
    <strong>무효리스크:</strong> Harhoff, Scherer &amp; Vopel (2003) — 선행기술 밀도, 심사 이력, KR IPR 기저율 ~10%<br>
    <strong>만료리스크:</strong> IP5 통계 — KR 특허 ~50%가 12년 전 소멸, 20년 법정 존속기간<br>
    <strong>상표리스크:</strong> 상표법 §34 — 선등록 유사 판단 기준<br><br>
    데이터 완결성 지수가 낮을수록 신뢰도가 낮습니다. 신뢰구간(CI)은 티어별 시그마를 사용한
    시드 부트스트랩 방식으로 산출됩니다 (tier-b σ=8, 1000 샘플, seed=42).
  </p>
</div>

<div class="disclaimer">
  IPScope MVP · 데이터 출처: {DATA_SOURCE} · v{result['app_version']} ·
  이 분석은 확률적 추정치이며 법률 자문이 아닙니다. 중요 사안은 IP 전문가에게 문의하세요.
  <br><a href="/" style="color:#0f3460">← 새 분석 시작</a>
</div>
</body></html>"""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    """Serve the applicant name input form."""
    return HTMLResponse(_FORM_HTML.format(css=_CSS))


@app.post("/analyze", response_class=HTMLResponse)
async def analyze(
    applicant_name: Annotated[str, Form()],
) -> HTMLResponse:
    """
    Run the full IPScope pipeline for the submitted applicant name.

    Checks the SQLite cache first; calls KIPRIS (mock or live) on miss.
    Returns an HTML traffic-light report.
    """
    name = applicant_name.strip()
    if not name:
        return HTMLResponse(
            "<p style='color:red'>출원인명을 입력하세요.</p><a href='/'>돌아가기</a>",
            status_code=400,
        )

    # Cache check
    cached = _cache.get(name)
    if cached is not None:
        logger.info("Serving cached result for '%s'", name)
        return HTMLResponse(_render_report(cached))

    # Fetch + run pipeline
    applicant_data = _kipris_client.get_applicant_data(name)
    result = run_pipeline(applicant_data)

    _cache.set(name, result)
    return HTMLResponse(_render_report(result))


@app.get("/analyze/json")
async def analyze_json(applicant_name: str) -> JSONResponse:
    """
    JSON variant of /analyze for programmatic access.
    Query param: applicant_name=<name>
    """
    name = applicant_name.strip()
    if not name:
        return JSONResponse({"error": "applicant_name is required"}, status_code=400)

    cached = _cache.get(name)
    if cached is not None:
        return JSONResponse(cached)

    applicant_data = _kipris_client.get_applicant_data(name)
    result = run_pipeline(applicant_data)
    _cache.set(name, result)
    return JSONResponse(result)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/info")
async def info() -> dict[str, Any]:
    """Application metadata, module list, weights, data source."""
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "modules": [
            {"name": "dispute", "weight": PATENT_MODULE_WEIGHTS["dispute"],
             "basis": "Lanjouw & Schankerman 2001"},
            {"name": "invalidation", "weight": PATENT_MODULE_WEIGHTS["invalidation"],
             "basis": "Harhoff, Scherer & Vopel 2003"},
            {"name": "expiry", "weight": PATENT_MODULE_WEIGHTS["expiry"],
             "basis": "IP5 KR statistics"},
            {"name": "trademark", "weight": None,
             "basis": "Trademark Act §34 (Korea)"},
        ],
        "weights": PATENT_MODULE_WEIGHTS,
        "grade_thresholds": GRADE_THRESHOLDS,
        "data_source": DATA_SOURCE,
        "concentration_penalty": "Herfindahl-Hirschman Index, weight=0.12",
        "ci_method": "Seeded bootstrap (seed=42, n=1000, tier-b sigma=8)",
    }
