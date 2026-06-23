All load-bearing claims verified at `/Users/chloekang/AlphaNexus`. Writing the report.

---

# RED TEAM LEAD — GO/NO-GO REPORT: AlphaNexus

**Scope:** IP-portfolio risk-screening FastAPI tool. Submitted KIPRIS 지식재산 대회 2026-06-11; results July 2026. Pre-entity, pre-revenue, solo founder.

**Lead verdict in one line:** The build is real and the specialist batch self-policed cleanly — I found **zero fabricated traction or valuation claims** that survived into the reports. What I am escalating are four credibility leaks that are **live in a repo KIPRIS judges can clone before July**, one of which (the LICENSE) is a legal artifact pointed at the wrong product. The company does not exist; the demo does.

---

## LEAD-VERIFIED GROUND TRUTH (re-ran at correct path, not trusted)

| Claim | Status | Evidence |
|---|---|---|
| Repo path | **`ventures/AlphaNexus` does NOT exist; real repo = `/Users/chloekang/AlphaNexus`** | `ls` confirms; the brief's path is wrong |
| 109 tests pass | ✅ TRUE | `109 passed in 1.60s` |
| LICENSE is a quant-trading license on an IP tool | ✅ TRUE, verbatim | `LICENSE:12` "trading logic", `:26` "trading", `:126` "alpha extraction", `:167` "$250,000" |
| Live mode imputes every scoring field to `None` | ✅ TRUE | `kipris_client.py:274–284` — 9 patent fields `None`; `:296–300` all 4 trademark fields `None` |
| Unknown applicant → fabricated portfolio | ✅ TRUE | `kipris_client.py:239` → `synthesize_applicant(applicant_name)` |
| Threshold doc drift | ✅ TRUE, **direction = README overstates** | `README.md:117` says "threshold 50"; `validate_retrospective.py:151` runs "threshold 20.0" |
| Zero crypto (Ed25519/hash-chain) | ✅ TRUE — absent | grep returns nothing |

---

## SEVERITY-RANKED FLAG TABLE

| Severity | Flag | Fix |
|---|---|---|
| **BLOCKER** | **Quant-trading LICENSE in submitted repo.** `$250,000` liquidated-damages clause, "alpha extraction", "Financial Use", "trading systems" — governing a patent tool. Dated pre-pivot. A judge cloning the repo reads copy-paste from the distinct 시장 퀀트 엔진. Conflation event in a legal instrument, in the submitted artifact, facially unenforceable under KR 민법 §398. | **Delete today.** Replace with "all rights reserved + informational-only, no attorney-client relationship" stub. Zero cost. |
| **BLOCKER** | **Silent fabrication-on-contact.** Unknown applicant name silently routes to `synthesize_applicant()` (`kipris_client.py:239`) and returns a styled, real-looking risk grade for a portfolio that does not exist. A judge typing their own / a competitor's / 삼성's name gets unflagged fiction on the live public demo. This is the product auto-generating fabricated grades on named real entities — a metric-truth and defamation vector. | **Route unknowns to explicit `데이터 없음` / insufficient-data state.** Never return a synthesized portfolio on the public path. |
| **BLOCKER** | **KIPI commercial-redistribution rights UNVERIFIED.** The entire forward thesis (calibrate on ~8,000 KR IPR outcomes, sell derived scores) rests on a 정보이용약관 **nobody in 17 reports read**. If KIPI prohibits resale of derived data, there is no lawful product, only a demo — and a solo individual likely cannot sign the commercial 정보이용계약 at all (needs entity). | **Get written KIPI answer on commercial redistribution of derived scores BEFORE any calibration work.** This gates whether the data plan is worth doing. |
| **HIGH** | **AUC=1.0 / F1 as a "result."** Tautological: rank-ordering 28 separable-by-construction fixtures (invalidated mean 31.0 vs upheld 7.1, zero overlap). The signals that define the score define the labels. The harness prints `AUC-ROC: 1.0000` as line 1 — croppable into a fabrication-grade number. | **Strip every AUC/F1/precision/recall and the `37.9` fixture number from all external surfaces (README header included).** Recaption `37.9` as "(synthetic fixture)" internally. |
| **HIGH** | **Live mode is hollow.** Every discriminating field imputes to `None` → population means → real applicants collapse to near-identical scores. A "successful" live KIPRIS run returns a grade that does not discriminate. "Live screening / real data" is indefensible in any tense. | **Do not claim live capability.** Honest ceiling: "honest mock demo + reproducible eval harness." Enriching to real fields = sustained multi-API engineering, gated behind the KIPI rights answer. |
| **MED** | **Threshold doc drift (README 50 vs code 20)** + **N drift (README ~30 vs 28 scored, 15/13 split).** The "honesty asset" fails its own audit; a technical judge uses this to discount the well-engineered narrative. | **Align README to code:** threshold 20, n=28 (15 invalidated / 13 upheld). |
| **MED** | **Reflected XSS on `applicant_name`** interpolated into HTML f-strings on the public Render endpoint. | **Escape `applicant_name` before rendering.** |
| **LOW** | **Cold-start 503 on Render free tier** — the #1 visible judge-facing lose condition. | **Keep-warm ping before/through July judging window.** |
| **LOW** | **"Moat" framing of commodity math.** `saturate`/`weighted_ensemble`/`concentration_adjust`/`bootstrap_ci` = logistic + factor sum + HHI + bootstrap. One-week port. | **Do not sell methodology lineage as defensibility.** Per gate rule 5: crypto is commodity AND absent; the engine is commodity too. |

---

## CLAIMS I KILL (soft inflation the batch was too polite to cut)

- **"Honesty is the moat."** No. Self-flagging disclaimers are table stakes that prevent disqualification; a competitor clones them in one commit. The only candidate moat is a labeled KR IPR-outcome corpus + KIPRIS-native distribution — **neither exists.**
- **Every incumbent comp (PatSnap / Clarivate-Derwent / Questel / IPRally).** UNVERIFIED across all reports — zero pricing, zero KR-coverage, zero feature data pulled. "We beat them on KR granularity" is an assumption dressed as a wedge. Flag, do not cite.
- **Every valuation band** (the "$0.5M–1.5M post-money", "₩0–300M option value", "$0–225K"). Pre-entity + pre-revenue + synthetic-only + unsigned data right = **not derivable.** A KIPRIS placement is a credential, not a financing event. Strike the bands from internal decks too — they leak.
- **The projected "real AUC 0.65–0.75" band.** Invented prior, not a forecast — no real record has been scored, and imputation-collapse means the model **may not clear a claim-overlap baseline at all.** Honest floor: "we do not yet know it predicts anything."

## WHAT SURVIVES (co-signed)

Real, competent FastAPI build; 109 passing tests; clean scoring spine; genuine in-repo caveats; live demo. Not vaporware. **Dev is done; dev was never the constraint.** Crypto/attestation correctly absent and irrelevant — anyone re-raising "Arbiter rail reuse" is killed on contact.

---

## THE BIGGEST RISK

**A $250,000 quant-trading LICENSE is pointed at the wrong product, sitting in a repo judges can read in July, on top of a KIPI data right nobody has read.** The binding constraint is not dev, and it is not even "entity + distribution" as 16 specialists concluded — it is the **legal surface**. If KIPI prohibits redistribution of derived scores, the entire calibration roadmap produces an asset that cannot be lawfully sold, and the LICENSE conflation already signals "solution hunting a problem" to the exact audience scoring the submission.

---

## GO / NO-GO

**CONDITIONAL GO as a contest entry. NO-GO as a company, a raise, or any external claim beyond "working MVP + honest eval harness."**

Blunt: this is a competent, honest KIPRIS submission — not a fundable asset, not a defensible moat, not a validated product. Proceed to judging **only after closing the two same-day liabilities**. Everything downstream gates behind the KIPI rights answer.

**Same-week, pre-July, in priority order:**
1. **TODAY** — delete the quant-trading LICENSE → informational-only stub.
2. **TODAY** — kill the silent `synthesize_applicant` fallback → explicit `데이터 없음`.
3. **Pre-July** — strip every AUC/F1/37.9 from judge-facing surfaces; reorder harness output so no naked `1.0` crops.
4. **Pre-July** — fix README threshold (50→20) and N (~30→28) drift; escape `applicant_name`; keep-warm the demo.
5. **Before any calibration** — written KIPI redistribution-rights answer.
6. **Gate all else behind ENTITY.** Do not "spend the next cycle calibrating" — the founder is legally/structurally blocked from running that sprint until entity + KIPI clearance exist.

**Files:** `/Users/chloekang/AlphaNexus/LICENSE` (quant license, replace) · `/Users/chloekang/AlphaNexus/app/kipris_client.py:239` (silent fabrication fallback) · `/Users/chloekang/AlphaNexus/app/kipris_client.py:274–300` (all-`None` live imputation) · `/Users/chloekang/AlphaNexus/validate_retrospective.py:151` + `/Users/chloekang/AlphaNexus/README.md:117` (threshold drift 20 vs 50).
