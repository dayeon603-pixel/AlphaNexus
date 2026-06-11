# IPScope — IP Portfolio Risk Screening Tool

MVP for patent and trademark portfolio risk screening. Accepts an applicant name,
runs four independent risk modules, and returns a traffic-light grade (HIGH / MED / LOW)
with a 0–100 portfolio score and an HTML report.

---

## Methodology: AlphaNexus Quant Engine Port

The scoring spine is ported directly from a quant trading risk engine:

- **`saturate(x, k)`** — logistic sigmoid maps raw signals to [0, 100]. Same mathematical
  structure as a logistic regression output layer.
- **`weighted_ensemble`** — normalized weighted sum across modules, identical to a factor
  model combining alpha signals.
- **`concentration_adjust`** — Herfindahl-Hirschman Index penalty. A portfolio dominated by
  one high-risk patent scores worse than the naive mean, mirroring concentration risk in
  portfolio management.
- **`bootstrap_ci`** — seeded Monte Carlo CI. Reliability tiers (a/b/c) map to signal sigma,
  directly analogous to factor uncertainty scoring in quant research.

---

## Four Risk Modules

| Module | Weight | Basis |
|--------|--------|-------|
| Dispute | 40% | Lanjouw & Schankerman (2001) — citation inverted-U, family size |
| Invalidation | 35% | Harhoff, Scherer & Vopel (2003); KR IPR base-rate ~10% |
| Expiry | 25% | IP5 — ~50% of KR patents lapse before year 12 |
| Trademark | separate | Trademark Act §34 (Korea) — prior-registration similarity |

---

## Quick Start

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
# Open http://localhost:8000
```

### Demo query

```bash
curl -X POST http://localhost:8000/analyze \
  -d "applicant_name=삼정테크 (주)" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

Expected: portfolio score ≈ **37.9 / 100**, grade **LOW**.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | HTML input form |
| POST | `/analyze` | Form submit → HTML report |
| GET | `/analyze/json?applicant_name=...` | JSON variant |
| GET | `/health` | `{"status":"ok"}` |
| GET | `/info` | Module list, weights, data source |

---

## Mock / Live Switch

- **Mock (default)**: 6 built-in fixture applicants. No API key needed.
  Any unknown applicant name falls back to the demo applicant.
- **Live**: Set `KIPRIS_SERVICE_KEY` env var to your KIPRIS Open API key.
  The client auto-detects and switches to live mode.

```bash
export KIPRIS_SERVICE_KEY="your_key_here"
uvicorn app.main:app
```

Live mode fetches from `https://plus.kipris.or.kr/kipo-api/kipi/`. Raw KIPRIS
records are sparse; missing fields are imputed conservatively (population anchors).

---

## Demo Fixture Applicants

| Name | Expected Grade | Notes |
|------|----------------|-------|
| 삼정테크 (주) | LOW (~37.9) | 4 patents incl. 1 lapsed |
| 한국대학교 기술지주 | LOW | Clean university spinout |
| 넥스테크 코리아 | MED | Mixed portfolio, refusal on TM |
| 글로벌IP홀딩스 | HIGH | NPE-style, trial history |
| 구형특허조합 | HIGH | All lapsed/expired |
| 박민준 (개인) | LOW | Individual inventor |

---

## Running Tests

```bash
python -m pytest -q
```

All tests run in mock mode (no API key required). The critical-path test
`test_demo_portfolio_score_approx_37_9` asserts the calibrated score is within
[36.5, 39.5].

---

## Validation Harness

```bash
python validate_retrospective.py
```

Scores ~30 labeled fixture records (invalidated vs upheld) using pre-trial signals
only. Prints AUC-ROC, precision, recall, F1 at threshold 50.

**Honest caveat**: The validation set is synthetic (constructed to have separable
signal profiles). A real production system requires calibration against the KR KIPRIS
IPR trial database (~8,000 proceedings since 2012). The AUC on these fixtures reflects
model rank-ordering on designed data, not real-world performance.

---

## Deploy to Render

```bash
# Push to GitHub, then:
# 1. New Web Service → connect repo
# 2. Set KIPRIS_SERVICE_KEY in Environment Variables
# 3. Deploy
```

Or use `render.yaml` for Infrastructure-as-Code deployment.

---

## MVP Scope

- Mock data only by default (live needs KIPRIS key + API access approval).
- Scoring constants (logistic k, anchor values) are tuned on synthetic fixtures.
  Production calibration requires backtesting against historical KR IP trial outcomes.
- No authentication, rate limiting, or PII handling — add before any public deployment.
- Report is informational; not legal advice.
