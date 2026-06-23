Ground truth confirmed: 109 tests, real FastAPI app, no client JS/SVG (motion designer's claim that animation is absent is correct), KIPRIS live-mode gated behind env key, silent fallback to demo applicant confirmed (`kipris_client.py:202`). Note: README claims a "Quant Engine Port" framing — but the gate map says don't conflate with the old quant engine. The methodology *math* is ported; the product is IP-risk. All four specialists converge. Synthesizing now.

---

# AlphaNexus — Design Team Report (Division A)

**TEAM VERDICT:** The hero artifact already exists and is correct — a single-screen, honestly-labeled IP-risk verdict — so don't redesign it; spend the entire pre-July budget making it *self-explaining, trust-safe, and demoable* for one KIPRIS-judge screen.

---

## Key Findings (verified against `/Users/chloekang/AlphaNexus`)

**What is real (ground-truthed by the lead):**
- `109` passing test functions across 6 test files; a real FastAPI app (`app/main.py`), routes `/`, `/analyze`, `/analyze/json`, `/health`, `/info`.
- Live demo `ipscope.onrender.com` returns 200, `/health` OK; `/analyze/json` emits a real structured payload (portfolio_score, grade, CI, per-patent analyses, weights, completeness).
- UI is one inline `_CSS` block + inlined HTML in `main.py`. **Zero** template files, **zero** client JS, **zero** SVG/canvas, **zero** `@keyframes`. The "gauge" is a static div; the score is a 42px number; the grade is a colored badge.
- Honesty layer is genuine: a demo-mode banner labels every figure as synthetic seeded mock data until `KIPRIS_SERVICE_KEY` flips it live. Methodology cited on-page (Lanjouw & Schankerman 2001, Harhoff et al. 2003).
- 6 deterministic fixtures (incl. `글로벌IP홀딩스` HIGH) → reproducible, screenshottable outputs.
- Live KIPRIS integration is **UNVERIFIED** — no key, no integration test.
- Note: README frames the scoring spine as a "Quant Engine Port." The *math structure* is reused (logistic saturate, weighted ensemble, HHI, bootstrap CI); the product is IP-risk screening and should be presented as such, not as the old 시장 퀀트 엔진.

**Where all four specialists converge:**
1. The **single-screen risk report** (score + traffic-light + per-patent CI table + on-page methodology) is the right hero and a real differentiator vs. a patent-table dump. Keep it, polish it.
2. UX is **not the moat** — data-network + KIPRIS distribution are (consistent with the gate map). But the demo *is* the artifact a judge scores in July.
3. Three shared weaknesses: (a) the verdict has **no "so what"** — a "37.9 / LOW" number with no top-3 risk drivers or next step; (b) the **landing page sells nothing** — a cold form, hero buried below the fold; (c) **no ownable identity** — default Bootstrap reds/greens read as "generated demo," no wordmark/favicon.

---

## Team Recommendation

Ship **one polished hero screen**, in `main.py`, no new infra, no SPA, no 3D. In priority order:

1. **Kill the silent fallback (trust-critical).** Confirmed at `kipris_client.py:202`: any unknown applicant silently returns the demo applicant, styled as a real result. Replace with an explicit `데이터 없음 — 데모 출원인 표시 중` state. A judge typing their own company name must never get unflagged fiction. **Do this first.**
2. **Add "Top 3 risk drivers" above the table.** Convert the bare number into an actionable verdict ("which patent sinks the portfolio"). This is the "so what" all four specialists flagged.
3. **Make the 6 fixtures one-tap chips that pre-load a result**, and put a live sample report (`글로벌IP홀딩스` HIGH) directly on the landing page — turn the cold form into an instant, projector-legible result.
4. **Fix one semantic collision + add minimal identity.** Recolor the completeness bar to neutral blue so green means only "low risk" (currently `#28a745` encodes both LOW-risk and the fill bar). Add a wordmark + favicon so the screenshot doesn't read "default template."
5. **Optional, high-ROI if time:** an ~8-second deterministic "verdict reveal" (count-up score + arc gauge + sequential module-weight bars, inline SVG/CSS, ~40 lines) as the single hero loop. Visualizes the four-module weighted-ensemble + HHI story that text currently hides.

All of the above is one file, one Render service, roughly one to two focused afternoons.

---

## Top Open Risks

1. **Silent demo-fallback = trust landmine (highest severity).** Verified in code. A KIPRIS judge entering a real name gets fabricated data with no flag — directly violates the metric-truth/honesty principle and could sink credibility on contact. Must be fixed before the demo is shown.
2. **Live KIPRIS mode is UNVERIFIED.** The product's entire "real data" claim rests on an env-gated path with no key and no integration test. If a judge expects live screening, the gap between mock demo and live capability is exposed. Needs an integration test (or an explicit "demo data" framing in the deck) before July.
3. **No moat from design, and README leans on "quant engine" framing.** Design polish wins the July screen but is commodity; the defensible moat is data-network + KIPRIS distribution + standard-setting, none of which the UI delivers. Secondary: the "Quant Engine Port" framing risks conflation with the distinct 시장 퀀트 엔진 — present AlphaNexus as an IP-risk product whose math happens to be ported, not as a repurposed trading engine.

*Repo verified at `/Users/chloekang/AlphaNexus`. Demo: `ipscope.onrender.com`. All traction/valuation claims: none made — none grounded.*
