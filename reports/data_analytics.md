All four specialists' claims are verified against the repo: 109 tests pass (1.21s), AUC=1.0000 on n=28 scored rows (29 invalidated/upheld after threshold — class split 15/13), invalidated/upheld means 31.0 vs 7.1 with no overlap, synthetic fixtures, and live `_normalize_patent` returns every scoring field `None`. README's honest caveat is present. Here is the team report.

---

# AlphaNexus — Data & Analytics Team Report (Division A)

**TEAM VERDICT:** Genuinely well-built, honestly-documented FastAPI screening tool with a **commodity scoring spine and ZERO real predictive evidence** — the headline "AUC 1.0" is a self-fulfilling artifact on synthetic data and must be killed externally; the only product that matters now is a labeled KR IPR trial-outcome dataset.

---

## Key Findings (all verified against `/Users/chloekang/AlphaNexus`)

**1. The build is real and above-MVP.** 2,274 LOC across 9 app modules; **109 tests pass in 1.21s** (re-run, confirmed). Scoring spine (`saturate` logistic, `weighted_ensemble` factor sum, `concentration_adjust` HHI, seeded `bootstrap_ci`) is pure, fully typed, deterministic. Four modules (dispute 0.40 / invalidation 0.35 / expiry 0.25 / trademark separate) cite real literature (Lanjouw-Schankerman 2001; Harhoff et al. 2003; IP5 lapse stats; KR Trademark Act §34). `# LOOKAHEAD RISK` markers present and correct (`validate_retrospective.py:7`). Live demo at ipscope.onrender.com ships an honest mock-mode banner. This is not vaporware.

**2. The only quantitative metric is circular — UNVERIFIED.** `validate_retrospective.py` reports **AUC-ROC = 1.0000, P = 1.000, R = 0.933, F1 = 0.966** on a synthetic `VALIDATION_SET` (30 rows in `app/fixtures.py`, 15 invalidated / 13 upheld scored). I confirmed the classes are **separable by construction**: invalidated mean 31.0 (min 19.4) vs upheld mean 7.1 (max 9.3) — **zero overlap**. The same signals that define the score define the labels. AUC=1.0 measures internal consistency, not predictive skill. To the repo's credit, the code and README state this verbatim ("These fixtures are synthetic/illustrative," "reflects rank-ordering on designed data, not real-world performance"). **The risk is leakage of "AUC 1.0" to any judge-facing surface, where it reads as naïveté or fabrication.**

**3. Live mode has no real signal today.** `kipris_client.py:269-297` confirms `_normalize_patent` returns **every scoring field = `None`** in live mode (forward_citations, family_size, claim_count, prior_art_density, office_action_count, ipc_density, trial_history all need additional KIPRIS API calls that are not wired). Live mode runs entirely on conservative imputation. The truthful claim is "honest mock demo + reproducible eval harness," **not** "live KIPRIS scoring."

**4. Module weights and anchors are priors, not fit.** 0.40/0.35/0.25 and the −2.2 base-rate anchor are asserted from cited papers and tuned on fixtures — config, not learned parameters. Never backtested against KR IPR outcomes.

---

## Team Recommendation

**One deliverable matters: replace the synthetic AUC=1.0 headline everywhere with a single real-data calibration KPI.** Pull **≥300 actual KR IPR 무효심판 확정 outcomes** (인용 vs 기각) from KIPRIS, score them with the **frozen current invalidation module** using strictly pre-decision / pre-trial signals (temporal split; `trial_history` frozen as-of filing — it is itself a leakage vector), and report honest **AUC + a calibration curve (Brier / reliability) with a bootstrap 95% CI**. Expect 0.65–0.75, not 1.0.

A defensible AUC of 0.70 ±0.05 on real trials is worth infinitely more to KIPRIS judges and to the moat than a perfect score on data designed to be perfect. The labeled 심결 dataset that this harness produces — calibrated, KR-specific, trial-outcome-grounded — **is the moat.** The math is commodity (logistic + HHI); incumbents (PatSnap, Clarivate/Derwent, Questel — feature parity UNVERIFIED) own data depth. The only credible wedge is a Korea-specific invalidation score nobody else publishes. Crypto/attestation is correctly irrelevant here.

Also surface the existing `completeness` index as a **coverage KPI** (fraction of real applicants that score without heavy imputation) — it already exists and answers the "does live mode actually work" question honestly.

---

## Top Open Risks

1. **Metric-truth leak (highest).** AUC=1.0 on self-authored fixtures appearing unqualified on any external/judge surface. It is mathematically circular. Gate it now; the README caveat must travel with any number that ships.

2. **No real validation = no product claim.** Without the ≥300-case real-trial calibration, every score is methodology, not measured accuracy. The tool is an honest demo, not a validated screener — and is not differentiable from incumbents on analytics depth.

3. **Live data pipeline is hollow.** Live mode returns all-`None` scoring fields; the unwired KIPRIS family / full-text / prosecution-history API calls are the gating dependency for both real scoring and the validation set. Until wired, "live KIPRIS scoring" is UNVERIFIED.

*Constraint noted (internal only): solo founder, pre-entity, pre-revenue. Dev is not the bottleneck — the labeled 심결 dataset and KIPRIS-native distribution are.*
