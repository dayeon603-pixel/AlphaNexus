The specialists all reference `/Users/chloekang/AlphaNexus` and converge on identical verified ground truth. I have enough to synthesize the team report.

---

# AlphaNexus — Funding Management (Division C) | Team Report

**Repo verified:** `/Users/chloekang/AlphaNexus` · Live demo: ipscope.onrender.com · KIPRIS 지식재산 대회 submitted 2026-06-11 (results July 2026)

## Team Verdict (1 line)
**Do NOT raise equity now** — AlphaNexus is a clean, honest competition entry, not a fundable company; the binding constraints are entity + real-data calibration + distribution, none of which dev capital fixes.

## Key Findings (all four specialists independently converged)

**Verified asset.** A real, externally-touchable FastAPI MVP: 109 passing tests, live Render demo returning HTTP 200 (~0.4s warm), five endpoints, a four-module patent/trademark risk scorer (dispute / invalidation / expiry / trademark) with HHI concentration penalty, seeded bootstrap CIs, and citations to real IP literature (Lanjouw-Schankerman, Harhoff). The pivot is real — `legacy_quant_js/` is preserved; the reuse is a math-library port, NOT the Arbiter attestation rail (crypto framing does not apply, and Ed25519/hash-chain is correctly absent).

**What does NOT support a raise (the disqualifiers):**
- **Mock mode.** The KIPRIS client defaults to MOCK (`kipris_client.py`; live mode needs `KIPRIS_SERVICE_KEY`, not exercised in tests). The live demo scores **synthetic/fixture data, not live patent records.** The data-network moat the gate map demands does not yet exist.
- **AUC=1.0 is on 28 synthetic, designed-to-separate fixtures** — the README flags this honestly ("rank-ordering on designed data, not real-world performance"). Honest engineering, but an unsellable and potentially liability-grade number if it ever appears in a deck.
- **Zero traction:** pre-revenue, pre-entity, no design partner, no LOI (all UNVERIFIED). KIPRIS submission is a credential, not a financing event.
- **No legal vehicle:** a solo, pre-entity founder cannot take a wire or sign a SAFE. This is a hard gate, not a detail.

**Valuation:** No team member will fabricate a band. If (and only if) a KIPRIS placement lands, a defensible pre-seed cap is **UNVERIFIED but bounded ~$0.5M–$1.5M post-money**; anything above $2M is unsupported by anything in the repo.

## Team Recommendation

**Sequence — non-dilutive first, equity never (yet):**

1. **Register the 사업자등록 / entity now.** This is the single gating action — it unlocks both grant cash and the standing to request KIPRIS bulk data. Dev is not the constraint; the legal entity is.
2. **Apply to 예비창업패키지 (KISED)** — up to ~₩100M non-dilutive, solo-founder eligible. (UNVERIFIED 2026 ceilings/deadlines — confirm at k-startup.go.kr / kista.re.kr.) Park TIPS (needs entity + operator sponsor).
3. **Flip the demo MOCK → live KIPRIS** on one real applicant portfolio and report an **honest out-of-sample AUC.** That single "live patent data → scored object," plus one named design-partner screening (IP attorney/agency), is worth more than any term sheet AlphaNexus could honestly sign today.
4. **Treat the KIPRIS prize (July) as validation + seed cash** — do not double-count until results land.

Burn is effectively zero (Render free tier, solo), so cash is **not** the binding constraint — real-data calibration and distribution into KR IP firms are. Capital, when taken, buys data access and calibration, never headcount.

## Top Open Risks

1. **Honesty inversion in diligence.** Opening an investor pipeline now would sell mock/synthetic data as live and AUC=1.0 as performance — the single largest reputational risk, and a direct violation of the metric-truth rule.
2. **No moat yet.** The defensible asset (calibrated KR IPR-trial dataset + KIPRIS distribution) does not exist; the scoring math (logistic/HHI) is commodity, and incumbents (PatSnap, Clarivate/Derwent, Questel — UNVERIFIED comparative depth) are analytics-rich. A synthetic-fixture MVP does not threaten them.
3. **Entity dependency.** Every meaningful funding track (grant or equity) is blocked until the entity is registered; until then there is nothing to value and no vehicle to fund.
