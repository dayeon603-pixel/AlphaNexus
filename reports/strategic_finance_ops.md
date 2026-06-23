All load-bearing claims verified independently: 109 tests pass, AUC=1.0 self-flagged as synthetic-only in README, live `_get_live` returns `None` for every scoring field. The specialists are aligned and grounded.

---

# Strategic Finance Ops — Team Report: AlphaNexus

**TEAM VERDICT:** A real, honestly-built FastAPI risk-scorer that is over-engineered relative to its inputs — it scores synthetic fixtures, not real portfolios, so it is a contest-grade demo, not yet a financeable company; the single unlock is real KR IPR trial calibration, not more code.

---

## Key Findings (all verified against `/Users/chloekang/AlphaNexus`)

**1. The product is real and clean.** FastAPI app, 4 risk modules (dispute / invalidation / expiry / trademark), a ported logistic + HHI-concentration + bootstrap-CI scoring spine, **109 tests passing** (confirmed: `109 passed in 1.59s`), live Render demo.

**2. Intellectual honesty is a genuine asset.** README and `validate_retrospective.py` both flag that **AUC=1.0 is on synthetic separable fixtures** (means 31.0 vs 7.1), explicitly labeled "model rank-ordering on designed data, not real-world performance." No traction, valuation, or accuracy is overstated in the repo itself.

**3. The decisive finance fact — live mode is hollow.** Verified directly in `kipris_client.py`: `_get_live` calls real KIPRIS HTTP/XML fetches, but `_normalize_patent` / `_normalize_trademark` set **every scoring-relevant field to `None`** (`family_size`, `forward_citations_pct`, `claim_count`, `trial_history`, `prior_art_density`, office-action count, etc.). In production mode the modules impute conservatively, so **live scores are near-useless today.** The data layer is the gap, not the engine.

**4. Cost structure is excellent and irrelevant.** Marginal cost per screen ≈ one KIPRIS Open-API call (free within quota) + a logistic eval + HTML render. Hosting ~$7–25/mo Render. No GPU, no LLM, no per-token cost → structural gross margin 90%+ *once priced*. **The bottleneck is never compute — it is data access and trust calibration.** (Cost numbers UNVERIFIED on exact tier.)

**5. No financeable unit exists yet.** Pre-entity, pre-revenue, solo, zero willingness-to-pay signal. Pricing anchors (PatSnap / Clarivate-Derwent / Questel enterprise seats, ~4–6 figure ACV) are all **UNVERIFIED** on exact KR SMB pricing. Any LTV / CAC / ARPU number would be fabricated; we report none. The KIPRIS contest result (July 2026) is an **award signal, not traction.**

## Team Recommendation

**Freeze feature work on the scoring engine — it is already over-built relative to its inputs.** Spend the next cycle doing exactly one thing: convert the synthetic AUC into a real one.

1. **Wire `_get_live` from stub to real for ONE module (invalidation)** — enrich the sparse KIPRIS records (family, citations, trial history) instead of imputing `None`.
2. **Backtest that module against the real KR KIPRIS IPR trial corpus** (~8,000 proceedings since 2012, already named in the README) and **publish a held-out AUC.**
3. **Get 3 patent attorneys (변리사) to run real portfolios and confirm whether the grade is right.**

A credible real-data AUC + 3 design-partner validations is the cheapest, only moat available — it is what converts a demo into a priceable asset and moves the product from a ₩50k novelty report to ₩수백만 opinion-replacement pricing. **Do not publish any price tied to a "risk score," and do not model pricing tiers, until that real number exists.** Monetize only the *workflow* (per-report screening for 변리사, anchored to a billable hour) in the interim.

The moat is **not** the FastAPI tool (commodity, weeks to replicate) and **not** crypto/attestation — it is a **KR-trial-calibrated invalidation dataset the incumbents under-serve**, plus a **distribution wedge into Korean SMEs / 변리사 / tech-transfer offices priced out of enterprise seats.** Both are data + distribution problems, not code problems.

## Top Open Risks

1. **No real-data validity (the existential one).** Every quality claim rests on synthetic fixtures; live mode imputes `None`. Until a real held-out AUC exists, the product cannot command pricing above novelty-tier and is not financeable.
2. **Entity + distribution, not dev, is the binding constraint.** Pre-entity means no invoicing and no KIPRIS-Plus contract; solo founder has no funnel. Incumbents already own the analytics layer — the wedge (SME/변리사 low end) must be proven with paying design partners, not assumed.
3. **Data-enrichment cost is unpriced labor, not capital.** Turning sparse KIPRIS records into scorable features (family, citation, prosecution, trial-history APIs) is sustained engineering effort with no proven demand behind it — risk of polishing an asset nobody has agreed to pay for.

*Repo: `/Users/chloekang/AlphaNexus` — key files: `app/kipris_client.py` (live stub), `validate_retrospective.py` + `README.md:117-142` (synthetic-AUC caveat). UNVERIFIED items flagged inline: all incumbent pricing, hosting tier, any LTV/CAC/ARPU/valuation.*
