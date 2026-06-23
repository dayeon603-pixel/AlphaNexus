All four specialists are corroborated by the repo. 109 tests, 2,274 LOC, KIPRIS live mode is an explicit "structural stub… NOT called in tests," default is mock/synthetic, and the README itself flags the AUC=1.0 synthetic caveat. The convergence is grounded. Synthesizing the team report.

---

# Current Market Evaluation — Team Report: AlphaNexus

**TEAM VERDICT:** A genuine, honestly-documented FastAPI MVP with zero real-data validation and no moat yet; treat it as a KIPRIS-competition credibility asset and a wedge to acquire the one thing that matters — a calibrated Korean IPR trial-outcome dataset — not as a fundable standalone company.

---

## Key Findings (verified against `/Users/chloekang/AlphaNexus`)

**What is built (VERIFIED).** Working FastAPI app, 2,274 LOC in `app/`, **109 passing test functions**, live Render demo (ipscope.onrender.com). Four risk modules — Dispute (40%), Invalidation (35%), Expiry (25%), Trademark (separate) — produce a 0–100 score + traffic-light grade + HTML report. Scoring spine (logistic saturate, HHI concentration penalty, weighted ensemble, bootstrap CI) is real and ported from the legacy 시장 퀀트 엔진. Module weights are anchored to cited IP-economics literature (Lanjouw-Schankerman 2001; Harhoff-Scherer-Vopel 2003).

**What is NOT real (VERIFIED, flagged in-repo).** The KIPRIS "live" path is a **structural stub** — `kipris_client.py` states plainly it is "wired but not called in tests"; the suite always runs in **mock mode** against fixtures + a deterministic synthetic generator. Validation **AUC = 1.0 / F1 = 0.97 is on ~28 synthetic, separable fixtures** — the README's own "Honest caveat" says this is not real-world performance and that real calibration requires the ~8,000-proceeding KR IPR trial database (since 2012). **Net: credible analytics scaffold, zero real-KIPRIS-calibrated signal. UNVERIFIED on real data.**

**Market position.** Global patent analytics is real but mid-single-digit $B and entrenched — PatSnap, Clarivate/Derwent, Questel, LexisNexis IP, IPRally, plus KR-native KIPRIS/WIPS (exact TAM and incumbent figures UNVERIFIED). AlphaNexus does not and should not compete on global corpus depth. Its only honest wedge is **Korea-specific, KIPRIS-native, explainable IP-risk screening** (KR IPR base rates, Trademark Act §34, KR lapse curves) — a niche the global generalists under-serve. The Ed25519/attestation framing does **not** apply to this product and should stay out of the narrative.

**Moat reality.** The scoring math is commodity (logistic + HHI + bootstrap — a competent quant ports it in a week). There is currently **no data moat**: it runs on public KIPRIS, not a proprietary outcome corpus. The single durable asset available is a **labeled KR invalidation/dispute outcome dataset** that lets the score be calibrated and proven. That asset does not exist yet.

**Valuation (honest).** Pre-entity, pre-revenue, solo, single-market, synthetic-only validation → **no defensible enterprise valuation.** Comparable solo KR pre-seed IP-tech option-value bands roughly **₩0–300M (~$0–225K), UNVERIFIED** — and that is option value on the founder + contest signal, not on the asset. No traction exists to value.

---

## Team Recommendation

**Stop building features — the engine, modules, UI, and tests are done.** Spend the entire next cycle converting the synthetic validation set into a **real, labeled KR IPR trial-outcome dataset** (KIPRIS data-access approval / 제휴) and report a **non-synthetic AUC** on the ~8,000 real proceedings. That single number is the *only* thing that converts AlphaNexus from an elegant calculator into the only calibrated KR IP-risk screener — and that dataset is the entire moat. In parallel, treat the KIPRIS submission strictly as a credibility/credential asset and a lever to obtain that data access; do not pursue a priced raise on the current MVP. If the dataset proves unobtainable, fold the scoring layer into a partner platform rather than running it standalone.

---

## Top Open Risks

1. **Data access is the whole game and is unsecured.** Without live KIPRIS approval + real KR trial labels, the product stays a methodology demo with an unfalsifiable AUC=1.0. This is the gating dependency for everything else.
2. **Commodity-tech / instant-replication risk.** Once the KR-niche is shown to be valuable, PatSnap/Questel/Clarivate can out-resource the scoring layer immediately; the only defense is being first to the calibrated KR outcome corpus and to distribution.
3. **Distribution + entity unsolved (the real constraint, not dev).** Solo, pre-entity, no channel into 변리사 / corporate IP teams / tech-transfer offices. A calibrated score with no distribution path is still not a business.
