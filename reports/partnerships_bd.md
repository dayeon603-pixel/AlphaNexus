I'll synthesize my specialists' analyses into a team report. All four verified the same repo ground truth, so I have strong consensus to work with.

# AlphaNexus — Partnerships/BD Team Report

**TEAM VERDICT:** Real, honest MVP with zero real-data validation; the entire BD problem reduces to one move — convert the KIPRIS submission into a KIPI/변리사 data-and-pilot relationship that simultaneously fixes the data moat, the calibration gap, and distribution. Everything else is premature.

---

## Key Findings (verified across all 4 specialists)

**Product is real, moat is not.** Working FastAPI app (`app/main.py`: `/analyze`, `/health`, `/info`), 4 risk modules (dispute/invalidation/expiry weighted 40/35/25, trademark separate), HHI concentration penalty, logistic scoring spine ported from the old 시장 퀀트 엔진, bootstrap CI, **109 passing tests**, live Render demo. The product *shell* is credible.

**Validation is synthetic and self-flagged.** AUC=1.0 holds only on n=28 designed-separable fixtures — explicitly caveated in-repo as NOT real-world performance. UNVERIFIED on any real IPR data. Specialist flagged a README discrepancy (text says threshold 50; harness runs at 20). The KIPRIS live client (`kipris_client.py`, ~298 LoC, gated behind `KIPRIS_SERVICE_KEY`) is a **wired stub, never exercised** — default is 6 mock fixtures. No auth, no rate limiting.

**The attestation/crypto framing does NOT apply.** Unanimous across specialists: this is analytics over patent data, not an Ed25519/hash-chain product. Drop "Arbiter rail reuse" entirely from BD. The "quant engine port" is cosmetic math reuse, not a moat — do not pitch it as such.

**The honest moat = data + distribution, and the founder has neither.** Global incumbents (PatSnap, Clarivate/Derwent, Questel, IPRally — all real vendors, all UNVERIFIED as warm/comps) own data depth; a solo MVP cannot out-data them. The only defensible wedge is **Korea-specific KIPRIS-native IPR-invalidation risk** — locally sharper than global vendors underweight it. That wedge requires calibration against the ~8,000-proceeding KR IPR trial corpus, which KIPI/KIPRIS gates and which is not granted to an individual.

**There is no standards play.** No certifying body, no interop standard for IP-risk scoring. The only standards-shaped asset is KIPRIS/KIPI itself (quasi-governmental data gatekeeper). "Becoming the cited KIPRIS-risk-score" is downstream of real calibration, not a current lever.

---

## Team Recommendation

**Stop adding modules. Land one data-and-pilot relationship in the KR IP ecosystem — this is the single move that compounds.**

The four specialists converged on the same door with two viable framings; pursue both as one campaign:

1. **Primary — KIPI / KIPRIS (via the 대회):** Treat the KIPRIS 대회 submission (6/11, results July) as a **distribution event, not an endpoint**. A placement converts the existing live-client API target into a credible data-access narrative + government-adjacent logo. Convert it into a formal KIPI data-access + pilot conversation NOW to secure a live API key and access toward the ~8k IPR trial corpus.

2. **Co-equal — one 변리사 firm or 한국발명진흥회(KIPA)/RIPC pilot:** A single Korean patent-law firm or government IP-support center that will **trade real historical IPR-trial outcomes (labeled invalidated/upheld) for free screening**. This one relationship simultaneously fixes (a) the data moat, (b) the synthetic-validation caveat, and (c) the distribution beachhead (변리사 desktops / SME deal flow). Worth more than every incumbent intro combined.

**Sequencing:** Calibration data is the gate to every channel. Incumbent/acquirer conversations (PatSnap, Clarivate, etc.) are premature — nothing to anchor them on pre-calibration. **The co-founder need is commercial/legal (a 변리사 advisor), not engineering.** Dev is done enough; entity + one design partner are the constraint.

---

## Top Open Risks

1. **Entity gate blocks the data gate.** KIPRIS Plus API approval and the ~8k-proceeding dataset are not granted to an individual. Pre-entity status directly blocks the one move that matters — incorporation is the unlock, not more code. **(Highest-priority dependency.)**

2. **Synthetic validation collapses on contact with real data.** AUC=1.0 on separable fixtures is, by construction, uninformative. Real KR IPR outcomes may show the model is no better than a baseline. Until a real-data AUC exists, no firm will route client portfolios through it — and the headline number cannot be used externally without the "synthetic" qualifier.

3. **Distribution dependency on a slow B2G/quasi-gov channel.** KIPI/KIPA/RIPC partnerships are credibility-rich but slow. Pair the slow government door with a faster 변리사-firm design partner so the data-and-distribution timeline does not stall on a single bureaucratic counterparty.
