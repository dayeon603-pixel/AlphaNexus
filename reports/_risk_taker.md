Everything verified: 109 tests pass, `synthesize_applicant` is sha256-seeded with spread [0.12, 0.88], the expiry live path is real, the LICENSE is the quant license. Every load-bearing fact in my specialists' reports is grounded. Now I write the LEAD report.

# AlphaNexus — Risk-Taker LEAD Report
## The boldest profit-maximizing bets, and why the Red Team is wrong to fear them

**Repo verified independently** (`/Users/chloekang/AlphaNexus`): 109 tests pass (1.76s) · live Render demo · `synthesize_applicant()` sha256-seeded, spread [0.12, 0.88] · expiry module consumes real KIPRIS `registerStatus`/`applyDate` with a zero-imputation lapsed/expired override (`modules.py:332-342`) · LICENSE confirmed the copy-pasted quant-trading license with a $250k liquidated-damages clause. Every load-bearing fact below is grounded in code I read. No fabricated traction, valuation, or accuracy. AUC=1.0 is a known liability and appears nowhere external.

---

## The one-line thesis

The cautious consensus is **correct on every fact and wrong on tempo.** When the whole team converges on "freeze features, get real KIPRIS data, don't incorporate, don't market, wait for July," they have priced the downside flawlessly and the upside at zero. The binding constraint was never dev (it's built) and never even data (one signal is already real) — it's the **assumption that entity, distribution, and calibration must happen in series, behind a July gate the solo founder doesn't control.** They don't. The asymmetric move is to run the cheap, pre-entity, no-honesty-risk legs **now**, before the KIPRIS-attention window closes. Downside is bounded at ~$0 (sunk build, ~$7-25/mo hosting — tier UNVERIFIED). The upside the consensus refuses to underwrite: a solo founder who walks into July with the first real users, the first warm KR-IP distribution, a real-data signal, and the first cited KR-risk standard — instead of a contest receipt.

---

## BET 1 — Ship the one already-real signal THIS WEEK. "Live mode is hollow" is 90% true and 10% free money.

**The bet:** Every cautious report collapsed live mode into "all fields `None`, imputation collapse, no product." Verified true — for the invalidation and dispute modules. **False for expiry.** `_normalize_patent` passes `registerStatus → status` (`kipris_client.py:285`) and `applyDate → filing_date` (line 282); the expiry module hard-overrides lapsed/expired patents to maximum risk with **zero imputation** (`modules.py:332-342`, basis "IP5 — KR patent term 20 years"). Wire one KIPRIS key, ship the demo with a truthful split-label: *"Expiry: LIVE KIPRIS register status. Invalidation/Dispute: synthetic baseline, calibration pending."*

**Upside:** Converts "100% mock demo" into "partially live, honestly labeled" for one afternoon. A judge who types a company with a lapsed patent and sees a *real* KIPRIS-sourced HIGH-expiry flag is worth ten synthetic fixtures. It is the highest-credibility-per-hour move in the entire stack, and it permanently kills the "it's all mock" objection.

**Cost:** ~1 afternoon. One `KIPRIS_SERVICE_KEY`, one split-label, one query path. No entity, no calibration, no capital.

**Why the Red Team is wrong to fear it:** They fear shipping a hollow live mode that embarrasses on a real query. But the expiry path is *not* hollow — it's the one module that needs nothing imputed. Their fear is correctly aimed at invalidation; they over-generalized it to a module that already works. Honestly split-labeled, the only thing that ships is truth.

---

## BET 2 — The KIPRIS submission is a distribution detonator, not a credential to file. Fire the outbound in June, not July.

**The bet:** Eleven reports said "treat KIPRIS as a credential, wait for July, open a slow KIPI data conversation." Backwards. A submission to a quasi-government IP body is the **single warmest intro a solo founder gets into the KR IP ecosystem, and its value decays fast.** Pre-stage 10-15 warm 변리사 / 기술지주 / TLO outbounds NOW, framed on the live submission, offering **free screening in exchange for 50-100 historical 무효심판 (invalidation) outcomes.**

**Upside:** This single barter relationship fixes three problems at once — the data moat, the calibration gap, and distribution. It needs **no entity** (it's a barter, not a sale), **no prize result** (the submission is the credential), and **no calibrated AUC** (the whole point is to *get* the labels that produce one). If even one firm says yes, July flips from "we'll see" to "we already have real labels and a design partner."

**Cost:** Days of drafting. One cold-email template, 10-15 sends.

**Why the Red Team is wrong to fear it:** They conflate *paid acquisition* (correctly killed — $0 ad budget) with *founder distribution* (the actual engine). Those are different line items. Killing the ad spend is right; killing the outbound forfeits the compounding asset while it's hottest. The data gate they're waiting on opens *faster* with distribution momentum as its input, not slower.

---

## BET 3 — Publish the open KR Invalidation-Risk Benchmark. The honesty isn't a caveat — it's the only standard-shaped moat a solo founder can seize.

**The bet:** The gate map demands the moat be data-network / standard-setting / distribution — not the algorithm. Standard-setting is the one of those three a solo founder can own *today*. Convert `validate_retrospective.py` into a **public, openly-documented "KR Invalidation-Risk Benchmark"** — synthetic-labeled now, real KIPRIS labels as they land. Whoever publishes the first cited, open, KR-native IP-risk benchmark **becomes the reference everyone later calibrates against.**

**Upside:** PatSnap / Clarivate / Questel structurally will *not* open-source their KR calibration — KR is a secondary market they deprioritize. That deprioritization is the opening. First-mover on the *evaluation standard* outlasts first-mover on the *score*, because every future KR IP-risk model has to benchmark against yours. It is the cheapest moat the founder can plant pre-revenue, and the KIPRIS window is the one moment a quasi-gov body is paying attention.

**Cost:** One engineering cycle the team already admits is otherwise idle ("dev is not the constraint"). The harness exists.

**Why the Red Team is wrong to fear it:** They filed this under "year 2 / downstream." Wrong clock. The standard is claimable *only while the category is empty*, and it's empty *now*. Waiting forfeits the one moat that doesn't require beating incumbents on data — it requires beating them on *showing up first*, which a 500-person enterprise vendor won't bother to do for KR.

---

## BET 4 — Incorporate now and file the grant. The binding constraint is also the cheapest action.

**The bet:** Eight teams named entity as the gate to data, contracts, and grants — then told the founder to *wait*. Incoherent. A **개인사업자등록 is a ~₩0, same-day, one-hour form.** It unlocks KIPRIS commercial-data standing, contracting capacity, and grant eligibility simultaneously. File **예비창업패키지 (KISED, up to ~₩100M non-dilutive, solo-eligible)** against the credential the founder already holds.

**Upside:** ₩100M non-dilutive against an existing credential is the highest EV/effort move available — a weekend's application. Entity converts a possible prize into a vehicle that can sign a pilot, hold a data agreement, and accept grant cash the week July lands.

**Cost:** One hour (entity) + one weekend (grant application). ~₩0.

**Why the Red Team is wrong to fear it:** They treated "entity + data + distribution" as years of work and equity-raise risk. It's a one-hour form and a barter. The downside of registering early is a dormant 개인사업자 (trivially closeable). The downside of waiting is no vehicle to convert a July placement. Massive asymmetry, and I fully concede their core point: **no equity raise now** — all four bets are non-dilutive and pre-entity-compatible.

---

## Non-negotiable guardrails (where I hold the Red Team's line exactly)

These bind every bet above. A risk-taker who ignores them is a fool, not bold:

1. **AUC=1.0 never touches an external surface, ever.** Verified circular (separable synthetic fixtures, means 31.0 vs 7.1, zero overlap). Unqualified, it reads as fabrication and converts the honesty-moat into a liability. Strip it from every judge-facing surface. Publish the *harness*, never the number-as-performance.
2. **Delete the quant-trading LICENSE today.** Confirmed: "trading logic," "alpha extraction," $250k liquidated-damages (`LICENSE:166-167`) bolted onto an IP product. Pure unforced downside; any judge or counterparty reads it as copy-paste. Replace with a clean "all rights reserved" stub before Bet 1 ships. Free to fix; gates everything.
3. **Live trademark/expiry paths return real data or are visibly labeled.** Kill any silent fallback to the demo applicant before a consumer or judge types their own name and gets unflagged fiction. One such moment sinks all four bets.
4. **Output stays descriptive, never prescriptive** (변리사법 scope). Screening triage, not legal opinion.
5. **No crypto / Ed25519 / attestation.** Verified absent and irrelevant. The moat is data-network + standard-setting + distribution, exactly per the gate. Do not bolt it on.
6. **No fabricated traction or valuation.** Zero users, pre-revenue, pre-entity — UNVERIFIED, stated as such. Valuation pre-entity/pre-revenue is **not derivable; I will not invent a band.** The only speculatively-defensible ceiling is ~$0.5-1.5M post-money *if* a KIPRIS placement lands, and only post-placement (UNVERIFIED).

---

## Bottom line for the orchestrator

The cautious plan optimizes for "never look stupid to a judge." The high-EV plan runs four cheap, asymmetric, pre-entity bets **in parallel** — a real-data expiry signal, pre-loaded KIPRIS-placement outbound, the first open KR IP-risk benchmark, and same-day entity + grant — **none of which require the data gate to open first, and all of which make it open faster.**

**Sequenced, all this cycle, total marginal cost ≈ $0 + one weekend:**
1. **Hours (hygiene, gates everything):** Delete the quant LICENSE → clean stub. Strip AUC=1.0 from every surface. Kill the silent demo-fallback.
2. **This week (Bet 1):** Provision one KIPRIS key, ship the live expiry signal with truthful split-labeling.
3. **June, parallel (Bet 2, the compounding move):** 10-15 founder-led 변리사/TLO outbounds, framed on the submission, bartering free screening for 50-100 real 무효심판 labels.
4. **One cycle (Bet 3):** Publish the open KR Invalidation-Risk Benchmark — plant the standard-setting flag while the category is empty.
5. **One hour + one weekend (Bet 4):** Register 개인사업자; file 예비창업패키지 (~₩100M non-dilutive).

The downside is already paid — the build is sunk, the burn is nil. **You do not freeze a free option with this payoff profile.** The real risk here isn't shipping too aggressively. It's a solo founder with a genuinely good engine sitting in pre-entity, mock-mode limbo until a competition result decides whether he's allowed to begin.
