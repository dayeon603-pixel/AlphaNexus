Confirmed: AUC=1.0 on 28 synthetic records (harness threshold=20, README §117 says 50 — the doc/code drift the specialists flagged). The "37.9" is a hardcoded mock-fixture assertion, not a real-data result. All specialist claims are grounded. Synthesizing the team report.

---

# AlphaNexus — Multidisciplinary R&D Team Report

**Team verdict:** Genuinely well-engineered FastAPI shell (109/109 tests, live demo, honest internal caveats) with **zero real-data validation** — the asset is the labeled KR IP-outcome dataset it doesn't yet have, not the code, and every quantitative performance number must come off the external surface before the KIPRIS submission.

---

## Key findings (all verified against `/Users/chloekang/AlphaNexus`)

> **Repo location correction:** the code is at `/Users/chloekang/AlphaNexus`, **not** the briefed `ventures/AlphaNexus` path. In the `ventures/` monorepo AlphaNexus exists only as a portfolio pointer (`maturity: "built-external"`). Anyone grounding on `ventures/` alone will find nothing — flag this path drift.

**1. The build is real and competent.** 2,274 LOC across `app/`, **109/109 tests pass (1.24s)**, live demo `ipscope.onrender.com/health` → **HTTP 200**. Scoring spine is a hand-tuned logistic ensemble: `saturate()` sigmoid → per-module scores (dispute 0.40 / invalidation 0.35 / expiry 0.25, trademark separate) → HHI `concentration_adjust()` → seeded `bootstrap_ci()`. Pure functions, full type hints, `# LOOKAHEAD RISK` markers, `seed=42`. Dev quality is not the constraint.

**2. There is no validation, and the repo says so.** `validate_retrospective.py` reports **AUC-ROC 1.0000, F1 0.9655 — on 28 synthetic, deliberately self-separable fixtures** (invalidated mean ≈31.0 vs upheld mean ≈7.1, near-zero overlap). This is a separability artifact, not a result. AUC=1.0 is a red flag our ML and biomedical reviewers are trained to catch (leakage/separability signature). The README/harness disown it honestly — but **no real patent record has ever been scored.**

**3. Live mode is a structural stub.** `KIPRIS_SERVICE_KEY` flips a branch, but unknown applicants resolve to `synthesize_applicant()` (name-seeded synthetic portfolios). Real KIPRIS returns only ~5 fields; every discriminating signal (`family_size`, `claim_count`, `office_action_count`, `prior_art_density`) imputes to population means → **real applicants collapse toward the same score.** The demo only discriminates because of curated mock fixtures.

**4. Documentation drift to fix before submission.** Harness uses `threshold=20`; README §117 says "threshold 50." The "37.9/100" demo score is a hardcoded mock-fixture assertion (`test_demo_portfolio_score_approx_37_9`), not a data result.

**5. Coefficients are priors, not a fitted model.** Weights/offsets are anchored to cited literature (Lanjouw–Schankerman 2001, Harhoff 2003), never fit to labeled outcomes. The "quant engine port" framing is cosmetic — `saturate`/`weighted_ensemble`/HHI are generic primitives, not a transferred edge.

**Domain-fit note (internal):** three of four specialists (BCI/EMG, refrigeration, robotics/SDF) correctly reported their disciplines contribute nothing to a patent-analytics product and refused to force a lens — consistent with the no-fabrication rule. Signal-validation rigor is the only transferable thread, and it converged on the same conclusion.

---

## Team recommendation

**Stop polishing the synthetic AUC; spend the entire next cycle on one real labeled outcome set.** Concretely:

1. **Strip every quantitative performance claim** (AUC 1.0, F1, "37.9") from the KIPRIS submission and demo. Replace with one honest line: *"validated on synthetic separable fixtures; real-corpus calibration pending KIPRIS data access."* The number on the slide is the liability, not the asset.
2. **Make real data the only Q3 milestone:** secure the live KIPRIS key + the public **KR IPR trial corpus (~8,000 invalidation proceedings since 2012)**. Score even 50–500 real cases on a **temporally-split** basis and report AUC **inline-qualified** against a naive claim-overlap baseline. A defensible **0.62–0.70 on real out-of-sample trials beats 1.0 on fixtures infinitely** and is the only thing that converts a demo into a claim.
3. **If the score can't beat claim-overlap baseline, relabel honestly** — "portfolio overlap explorer," not "risk score" — until label data exists.
4. **Fix the threshold doc/code drift** (20 vs 50) as a hygiene pass.
5. **Drop the crypto/attestation framing entirely** (per gate map). Ed25519/hash-chain is commodity, absent, and irrelevant here. The moat is KR-specific calibrated base rates + distribution into Korean IP counsel / 대기업 IP teams — depth incumbents (PatSnap, Clarivate/Derwent, Questel, IPRally) don't own at KR granularity.

---

## Top open risks

1. **Validation void (highest).** No real-data evidence the score predicts anything. AUC=1.0 on synthetic fixtures is a credibility liability if it reaches any external surface — a KIPRIS judge or technical reviewer will read it as a red flag, not a strength.
2. **Imputation collapse in live mode.** With KIPRIS supplying ~5 fields and the rest imputed to means, real applicants converge to near-identical scores. The product may not actually discriminate on real input — **UNVERIFIED** until tested on live records.
3. **No moat yet + solo/pre-entity distribution gap.** Defensibility lives entirely in the labeled KR-IP outcome dataset and a KIPRIS-native channel — neither secured. Build is done; **entity + a wedge customer (KR IP counsel) + the data grant are the real constraints**, not engineering. Incumbents own the enriched patent data that makes these signals computable.
