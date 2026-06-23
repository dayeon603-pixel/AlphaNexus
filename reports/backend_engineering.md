Confirmed. The real AlphaNexus at `/Users/chloekang/AlphaNexus` matches the Cryptography Engineer and Security Engineer reports exactly (109 tests, FastAPI, four risk modules, KIPRIS, score ≈37.9). The Distributed-Systems and API/infra specialists grounded on the wrong repo (`veracity`) and their AlphaNexus conclusions are void. I have ground truth.

---

# Backend Engineering (Division A) — Team Report: AlphaNexus

**TEAM VERDICT:** AlphaNexus is a real, test-backed FastAPI MVP (109 passing tests, live Render demo) whose scoring spine is genuinely implemented — but it is calibrated entirely on synthetic data and its "live" KIPRIS path returns imputed, not real, signals; the engineering is done, the moat (real KR IPR-trial calibration + distribution) is not.

---

## Dispatch correction (read first)

The brief pointed at `/Users/chloekang/ventures/veracity`. **That is the wrong repo** — it's *Veracity*, an AI-voice-fraud detector under the Arbiter org, unrelated to IP/patents. Two of four specialists (Distributed-Systems, API/infra) analyzed `veracity` and their AlphaNexus-specific conclusions are **discarded**. The real product lives at **`/Users/chloekang/AlphaNexus`** and I verified it directly: FastAPI app (`app/main.py`), four risk modules, KIPRIS client, **109 tests pass in 1.23s**, demo score ≈37.9/100 grade LOW — matching the README and the Crypto + Security specialists who grounded correctly. Findings below rest only on the verified repo.

## Key findings (all verified in-repo)

1. **Working MVP, not vaporware.** Real scoring spine ported from a quant engine: `saturate()` (logistic), `weighted_ensemble()` (factor-style normalized sum), `concentration_adjust()` (HHI penalty), seeded `bootstrap_ci()`. Four modules with cited academic basis (Lanjouw-Schankerman 2001; Harhoff-Scherer-Vopel 2003; IP5 lapse stats). Endpoints `/health`, `/info`, `/analyze`, `/analyze/json`. Deployed via `render.yaml` (`ipscope`, free plan, `/health` check).

2. **"Live" mode is effectively synthetic.** `kipris_client.py` exists, but per the README and Security specialist, raw KIPRIS records are sparse and the scoring fields (`forward_citations_pct`, `family_size`, `claim_count`, `trial_history`) are **imputed via population anchors**. The live demo grades are therefore not driven by real per-applicant patent data. The README is honest about this; **any external pitch must be too.**

3. **Metric-truth hazard: AUC-ROC = 1.0000.** `validate_retrospective.py` reports perfect AUC on ~28 fixtures the code itself labels "constructed to have separable signal profiles." That is a tautology, not evidence. The README caveats it (line 119-122), but the headline number is dangerous — **never quote 1.0 AUC externally.**

4. **Crypto framing does not apply — correctly.** Grep for `ed25519|nacl|signature|hash.?chain|ledger|merkle` across the repo: **zero hits.** Per gate rule, Ed25519/hash-chain is commodity and here not even a feature. Signing an uncalibrated score would manufacture false authority over a number that isn't yet correct. **Do not add an attestation rail.**

5. **Demo-grade security exposure.** No auth, no rate limiting, no `Depends`/middleware. `applicant_name` flows into an HTML template — **reflected-XSS surface** if rendered unescaped. Acceptable for KIPRIS judging; **not** for any real user.

## Team recommendation

**Ship-state for KIPRIS is adequate; do not over-build.** Before July results, two cheap, high-value backend moves:

1. **Wire ONE real KIPRIS field end-to-end** — `registerStatus → expiry module` is the cheapest fully-real path — so the demo has at least one non-imputed live signal instead of an all-imputed grade.
2. **HTML-escape `applicant_name`** to close the XSS surface (one-line fix).

Everything else (auth, rate-limit, full live-field wiring, the provenance log) is **post-entity**, not an MVP blocker. The Crypto specialist's deferred provenance idea — a deterministic append-only log keyed by `(input_hash, app_version, weights, seed)` for reproducible/disputable reports — is the right **v2** direction (hashed record, not signed rail) but explicitly not now.

**The constraint is not code.** Dev is done. The moat is real-trial calibration depth (the ~8,000-proceeding KR KIPRIS IPR corpus, **UNVERIFIED / not yet done**) plus distribution into Korean IP firms — neither of which incumbents' code-equivalence can substitute for. Solo, pre-entity, pre-revenue.

## Top open risks

1. **Calibration gap (highest).** Scoring constants are tuned on synthetic fixtures. Until backtested against the real KR IPR trial database, every score is a plausible-looking estimate with **UNVERIFIED** real-world accuracy. This is the difference between a demo and a product.
2. **Data-access dependency.** "Live" requires a `KIPRIS_SERVICE_KEY` + API approval, and even then fields are sparse/imputed. The entire moat thesis hinges on data depth the repo does not yet have. Incumbents (PatSnap, Clarivate/Derwent, Questel — **UNVERIFIED** competitive specifics) own that depth.
3. **Metric-truth & demo exposure.** AUC-1.0-on-synthetic must never be presented as performance; the unescaped `applicant_name` is an open XSS surface on a public endpoint. Both are documented-but-live.

**Relevant paths:** `/Users/chloekang/AlphaNexus/README.md`, `/Users/chloekang/AlphaNexus/app/{main,scoring,modules,pipeline,kipris_client}.py`, `/Users/chloekang/AlphaNexus/validate_retrospective.py`.
