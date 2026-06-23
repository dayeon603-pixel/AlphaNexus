All load-bearing claims verified: 109 tests, four modules (dispute 0.40 / invalidation 0.35 / expiry 0.25 + separate trademark), VALIDATION_SET ~30 synthetic rows, README honest caveat intact. The specialists are accurate and convergent. Synthesizing.

---

# FUTURE IDEAS — TEAM REPORT: AlphaNexus

**TEAM VERDICT:** A real, honestly-scoped FastAPI IP-risk scorer whose only defensible year-2 asset is not the tool but a **labeled KR IPR trial-outcome dataset** (~8,000 KIPRIS proceedings) — own that corpus or remain a commodity demo.

---

## Key Findings (verified against `/Users/chloekang/AlphaNexus`)

- **The tool is real and credible as a submission artifact.** FastAPI app, 4 risk modules (dispute 0.40 / invalidation 0.35 / expiry 0.25, trademark scored separately), logistic-saturate → weighted-ensemble → HHI concentration penalty → seeded-bootstrap-CI spine ported from the old 시장 퀀트 엔진. **109 tests collected and passing** (verified). Live demo on Render. Typed, deployable (Procfile/render.yaml).
- **Accuracy is UNVERIFIED — and the repo says so.** `validate_retrospective.py` runs against `VALIDATION_SET` of ~30 **synthetic, self-labeled, separable-by-construction** rows. Any AUC≈1.0 / F1≈0.97 figure is rank-ordering on designed fixtures, not validation. README carries the honest caveat verbatim ("validation set is synthetic… AUC reflects [separation]"). Live KIPRIS mode is a coded **structured stub** (`KIPRIS_SERVICE_KEY` switch), not run against real records.
- **The moat is NOT the model and NOT crypto.** Logistic + HHI is commodity; Ed25519/attestation is irrelevant here (gate rule 5 holds — do not bolt it on). Global incumbents (PatSnap, Clarivate/Derwent, Questel, IPRally — positioning UNVERIFIED, do not fabricate) out-resource any solo modeling effort and out-data it 1000:1. **All four specialists converged independently on the same wedge:** Korea-specific, statute-anchored (Trademark Act §34), calibrated KR-IP-outcome data that global vendors deprioritize because KR is a secondary market.
- **Distribution, not features, is the bottleneck.** Solo, pre-entity, pre-revenue. Dev is done enough; what's missing is real labels and an embedding channel.

---

## Team Recommendation

**One bet, year-2: turn the synthetic validation harness into a real, openly-documented KR invalidation-risk benchmark calibrated on KIPRIS trial records — and make *that dataset*, not the FastAPI tool, the product's spine.**

- **Immediate, do-now:** Kill any AUC=1.0 claim on every external surface (demo, KIPRIS submission, README header). Replace with one honest line: *"calibration against a real KR IPR trial corpus pending."* This is the cheapest credibility move available and consistent with metric-truth rules.
- **Highest-leverage concrete step:** Acquire even **200–500 real KIPRIS trial-outcome labels** to convert synthetic separation into real calibration. That single dataset is the only asset a solo, pre-entity founder can own that PatSnap/Clarivate structurally won't replicate for Korea.
- **Distribution beachhead (fast-cycle B2B to pair with slow B2G/KIPRIS credibility):** "risk-as-a-feature" API embedded in KR-domestic workflows — 변리사 offices (pre-filing triage), 기술지주/public TLOs — not a standalone dashboard.
- **Adjacency optionality (do not commit, just hold):** the calibrated 0–100 + CI primitive is the exact input an **IP-insurance underwriter or IP-collateralized-lending desk (기술보증기금 / IP담보대출)** consumes — sell the score to the institution pricing the risk, not to inventors. Defer FTO/M&A triage and JP/US expansion (surface area, not moat).

---

## Top Open Risks

1. **Data access is the whole bet, and it's unproven.** The KIPRIS trial DB is *named*, not *obtained*. If real labels can't be scraped/licensed at scale (API approval, rate limits, ToS), the dataset moat collapses and AlphaNexus stays a synthetic demo. This is the single point of failure — validate access before any roadmap.
2. **Calibration constants are tuned on synthetic fixtures.** Logistic k and anchor values were fit to make the demo separable. First contact with real KR outcomes may move scores materially; current base-rate cites (~50% lapse by yr 12, ~10% IPR) are commodity and unvalidated against the live corpus.
3. **Solo-founder distribution + entity gap (internal note).** Pre-entity, pre-revenue, no design partner. Even with a perfect dataset, no channel into 변리사/institutional workflows means no network effect. Standard-setting requires citation and adoption the founder cannot manufacture alone — distribution risk dominates execution risk.
