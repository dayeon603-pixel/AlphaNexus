I have four strong specialist reports. They converge tightly. Synthesizing into one team report.

# AlphaNexus — Product Management Team Report

**Team verdict:** A real, well-engineered FastAPI screening prototype with zero real-data validation — freeze feature work, and spend the entire next cycle on one thing: a live KIPRIS query returning a real applicant report, calibrated against real KR invalidation outcomes.

---

## Key Findings

**What is verified (repo `/Users/chloekang/ventures/AlphaNexus`, demo on Render):**
- Working FastAPI app: `/`, `/analyze`, `/analyze/json`, `/health`, `/info`. `/health` returns ok on the live demo.
- 4 risk modules — Dispute 40% / Invalidation 35% / Expiry 25% / Trademark (separate) — each anchored to a cited IP-economics paper.
- HHI concentration penalty, seeded bootstrap CIs, SQLite cache, traffic-light + 0–100 HTML/JSON report.
- **109 tests pass.** ~2,300 LOC. Mock/live KIPRIS switch with 6 fixtures in mock mode.
- Methodology lineage ported from the 시장 퀀트 엔진 (logistic `saturate`, `weighted_ensemble`, HHI `concentration_adjust`).

**What is UNVERIFIED / honestly weak (and correctly disclosed in-repo):**
- **Validation AUC = 1.0 / F1 = 0.97 is on 28 synthetic, separable-by-construction records.** The README and harness both flag this honestly. It is NOT predictive evidence and must never appear externally as a performance claim — that would be a metric-truth violation.
- **Live KIPRIS path is a structural stub.** `_fetch_live_patents` is real `urlopen` + XML code but is never exercised (no API approval, XML schema unconfirmed, not in tests). No "live" claim is currently defensible.
- Scoring constants are tuned on 6 fixtures, not on real KR IPR trial outcomes. **Zero real evaluation exists.**
- The "quant engine port" is methodology lineage, not a moat. A logistic + factor-sum + HHI ensemble is commodity math.

**Gate alignment:** Crypto/attestation (Ed25519 + hash-chain) is correctly irrelevant here — this is patent analytics, not the Arbiter signed-attestation rail. The moat must be data + KR-localized calibration + distribution, not the algorithm.

---

## Team Recommendation

**Stop adding modules. Single-thread the next cycle on the one binary event that makes this a product: a real KIPRIS live query plus one real-data calibration of the Invalidation module.**

1. **Secure KIPRIS Open API approval and prove the live path end-to-end on one real applicant.** This converts the stub into a product; without it, everything else is a demo. Kill the synthetic fallback on the public path — route unknowns to "insufficient data," never a fabricated score.
2. **Replace the synthetic harness with 50–100 hand-labeled real KR invalidation outcomes** (from the ~8,000 public IPR proceedings). A real AUC of 0.65 beats a synthetic 1.0 for every downstream conversation — judges, users, attorneys, any future entity.
3. **Pick ONE wedge and freeze the rest.** The Invalidation module is the sharpest asset (cited base-rate model, real legal grounding). Freeze Expiry + Trademark as garnish.

**Wedge — where specialists converge with slight nuance:** Korea-native, KIPRIS-localized, opinionated single-number risk triage for users the global incumbents (PatSnap, Clarivate/Derwent, Questel, IPRally — unverified scope) underserve. Two candidate buyers, both valid, pick by which 5 discovery calls land first:
- **변리사 / SME applicants** — want defensible cited invalidation risk; matches the methodology framing.
- **KR VC/accelerator M&A pre-diligence + 기술지주/TTO** — want fast red/yellow/green triage on a single target; matches the traffic-light UX exactly.

The moat is **distribution into the KR IP-agent / 기술지주 channel + a calibrated KR-IPR score**, not features. The binding constraints are entity + distribution + a real data path — dev is not the constraint.

---

## Top Open Risks

1. **No real-data validation.** The only number that exists is a synthetic AUC=1.0. Until one honest AUC on real KR outcomes exists, there is no evidence the product predicts anything — and the synthetic figure is a live liability if it ever leaks into a pitch as "1.0 AUC." UNVERIFIED: all accuracy.
2. **Live KIPRIS path unproven (API-access dependency).** The whole near-term value hinges on KIPRIS Open API approval — an external gate the solo founder doesn't control. No live claim is defensible until one real query round-trips.
3. **No moat and no defined buyer yet.** Against incumbents' data depth, an uncalibrated 4-module score is not defensible, and there's zero in-repo evidence of a validated user. UNVERIFIED: all traction, valuation, distribution. Valuation band: not derivable pre-entity, pre-revenue, pre-validation — flag UNVERIFIED rather than estimate.
