The repo is at `/Users/chloekang/AlphaNexus` (specialists referenced this path). The specialists already verified ground truth (109 tests, FastAPI app, live demo, mock-default, KIPRIS submission). My role is synthesis, not re-verification. The reports are consistent. Here is the team report.

---

# Product Launch Team Report — AlphaNexus (IPScope)

**TEAM VERDICT:** AlphaNexus is a credible working MVP (real FastAPI tool, 109 passing tests, live demo) but commercially pre-launch — there is no "GA" to ship because the only differentiator (real KIPRIS-calibrated scores) does not yet exist; freeze all GTM/GA planning and spend the entire pre-July window on one real live-KIPRIS run plus guaranteed demo uptime for judging.

---

## Key Findings (all four specialists converged)

**What is actually shipped (VERIFIED):**
- Real FastAPI app, ~2,274 LOC / 9 modules, **109/109 tests passing** (~1.3–9s depending on run).
- 5 endpoints (`/`, `/analyze`, `/analyze/json`, `/health`, `/info`); 4 risk modules (Dispute / Invalidation / Expiry / Trademark) over a ported quant scoring spine (logistic saturate, weighted ensemble, HHI concentration, bootstrap CI); traffic-light grade + 0–100 score + HTML & JSON reports.
- Deploy infra present: `render.yaml` + `Procfile`; live demo `ipscope.onrender.com`; keep-warm CI cron exists (commit `59b25e0`).
- KIPRIS 지식재산 대회 **submitted 2026-06-11; results expected July 2026.** This is the only externally-binding date, and it has already passed.

**What is NOT real (VERIFIED caveats, README-admitted):**
- **Live KIPRIS mode is a structured stub** (`kipris_client.py` — not called in tests). `/info` self-reports `data_source: KIPRIS (mock)`. Default is 6 synthetic fixtures.
- **Validation set is synthetic.** Reported AUC reflects rank-ordering on designed data, NOT production performance. Every score is UNVERIFIED against real KR IPR outcomes.
- **No auth, no rate-limit, no PII handling** (README §MVP Scope) — blocks any "GA" / pilot claim.
- **Cold-start liability:** Render free tier spins down; specialists observed a 503 and an empty `/health` on first hit (~20–60s spin-up). On the one surface judges will click before July, this is a disqualifier-class risk.

**UNVERIFIED (no fabrication):** any user, any waitlist, any design partner, any real-portfolio run, any KIPRIS key approval, any revenue/valuation. Solo founder, pre-entity, pre-revenue.

---

## Team Recommendation

**Do NOT pursue a GA or beta→GA cutover.** Dev is not the constraint; there is no deadline pulling a release and no entity to sell through. Run a **beta→evidence** posture instead, sequenced by leverage:

1. **Harden the live demo for the July judging window (highest ROI, ~1 hr):** make keep-warm 24/7 or move off free tier; add a sub-second loading state + a visible "demo mode — synthetic data" banner (started, commit `6c58f30` — verify it renders). A judge must never see a cold timeout.
2. **Gate the next milestone on ONE real KIPRIS-key live run** end-to-end on a real Korean applicant — not more modules. This is the beta→credible transition and the only thing that converts the synthetic-validation caveat into a real claim.
3. **Make the single launch claim "screening triage," never "legal-grade."** The honest ceiling is calibrated, inline-qualified AUC on real IPR-trial data.
4. **Defer auth / rate-limit / entity** until KIPRIS results decide whether the venture continues.
5. **Moat = distribution, not crypto, not code.** Ed25519/attestation is irrelevant here. The wedge is KR-specific KIPRIS-native screening at a price point PatSnap/Clarivate/Questel ignore; the unlock is landing one patent attorney or TLO (기술이전조직) to run their own portfolio for one anonymized case study.

---

## Top Open Risks

1. **Cold-start 503 before July judging.** The most visible, highest-probability launch failure on the only surface with a real deadline. Mitigation is cheap and must ship first.
2. **Synthetic-only validation = unproven moat.** Until one non-fixture portfolio is scored via a live KIPRIS key, the entire data/analytics-depth thesis is UNVERIFIED and every incumbent comparison is unfavorable.
3. **No distribution / no entity.** Solo, pre-entity, pre-revenue means there is nothing to launch *into*. The KIPRIS result (July) is the real go/no-go gate; manufacturing a GA before it is wasted effort.
