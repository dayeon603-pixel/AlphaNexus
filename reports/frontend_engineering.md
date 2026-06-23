# Frontend Engineering Team Report — AlphaNexus

**TEAM VERDICT:** Keep the inline-HTML FastAPI surface as-is (a React/native rebuild would be pure waste); spend one focused frontend cycle on a shareable/exportable provenance-stamped report + one HHI concentration visual, and close the XSS hole — these are the only frontend moves that compound into distribution and trust.

---

## Key Findings (verified against `/Users/chloekang/AlphaNexus`)

- **The "frontend" is server-rendered inline HTML+CSS strings inside `app/main.py`** (~349 LOC): a Korean input form (`GET /`), a traffic-light report (`POST /analyze`), plus `/analyze/json`, `/health`, `/info`. No React, no SPA, no build step, no `templates/`, no `static/`, zero JS. 109 tests pass (~1.4–1.8s), default path is MOCK/synthetic. The React/`legacy_quant_js/` artifacts are dead 시장 퀀트 엔진 code, not part of the product.
- **The single strongest UI asset is honesty:** `_DEMO_BANNER` renders a prominent bilingual ("데모 모드 — 합성·예시 데이터, not live KIPRIS results") warning when `KIPRIS_SERVICE_KEY` is unset. This is moot-aligned trust signaling for a KIPRIS judge. It must never be removed for screenshots or judging.
- **Report content is genuinely good for a risk tool:** score + 90% CI, traffic-light badge, data-completeness bars, per-patent/per-trademark breakdown, and per-module academic basis cited inline (Lanjouw & Schankerman, Harhoff et al.). Showing CIs and completeness inline is exactly right where overconfidence is the failure mode.
- **Verified weaknesses (frontend-scoped):**
  - **Reflected XSS risk** — applicant/title fields are raw f-string-interpolated into HTML; no escaping. Highest-priority fix.
  - **Silent fallback** — unknown names silently render the demo applicant, which on a live judge demo reads as fabricated output. Make the fallback visible ("이름 미발견 — 데모 출원인 표시").
  - **The most defensible analytic is invisible** — the Herfindahl/HHI concentration penalty is described in prose but never shown as a visual.
  - **No responsive layout, no loading state, no export/PDF, no shareable permalink** — the one feature an IP screener actually needs for distribution.
  - **`validate_retrospective.py` prints AUC-ROC = 1.0000 on 28 synthetic records** (the harness flags it honestly). A perfect AUC reads as a red flag, not a strength — quarantine it from every external surface.

## Team Recommendation

1. **Do NOT build a React SPA or native/Expo app.** Dev is not the constraint; entity + distribution are. A framework/app-store identity adds build pipeline, app-store identity a pre-entity solo founder can't cleanly hold, and zero distribution lift for a B2B patent-attorney buyer at a desk.
2. **Ship one distribution artifact:** a self-contained, shareable HTML/PDF report export with an embedded provenance header (data source, mock-vs-live, CI method, timestamp). This is what a KIPRIS judge forwards and what an attorney pastes into a memo — turning the demo page into a distributable surface.
3. **Add exactly one visual** to `/analyze`: a horizontal HHI concentration bar (inline CSS divs, no JS) so the most defensible analytic is legible in three seconds.
4. **Close XSS + make the fallback visible + add a `@media` block and viewport meta** in the same pass (mobile degrades acceptably today but is not responsive-designed).
5. **Guarantee the Render demo never cold-starts during judging** — the keep-warm GitHub Action (`keep-warm.yml`) exists; verify it pings before the judging window, or add a cached demo applicant / static fallback. A 30–50s cold start on a judge's first click is a real lose-condition (cold-start timing UNVERIFIED).

## Top Open Risks

1. **Trust/honesty surface regressions** — removing `_DEMO_BANNER`, the silent unknown-name fallback, or any AUC=1.0 output leaking to a judge would each convert an honest MVP into apparent fabricated traction. These are the highest-severity, lowest-effort failure modes.
2. **Security: reflected XSS** on interpolated applicant/title fields — live on a public Render demo; must be escaped before any user-driven input is accepted.
3. **Render free-tier cold start during judging** (UNVERIFIED but likely) — single highest demo lose-condition; mitigation exists (keep-warm) but is unverified against the judging window.

**Scope note:** Frontend is not the moat and not the constraint. UI polish wins demo points but cannot create defensibility — that lives in real KIPRIS-calibrated data, which is currently mocked and UNVERIFIED.
