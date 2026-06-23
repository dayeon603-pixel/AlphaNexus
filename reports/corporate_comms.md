Verified: 109 tests pass, the 37.9 demo score is a real bounded assertion (a fixture/calibration target, not measured market traction). All four specialists converge on the same truth despite path/count discrepancies. Now I'll synthesize.

---

# AlphaNexus — Corporate Comms Team Report

**Division B / Corporate Comms · Milestone: KIPRIS 지식재산 대회 (submitted 2026-06-11, results July 2026)**

## Team Verdict (1 line)
AlphaNexus is a **real, self-honest, 109-test-passing FastAPI IP-risk MVP whose biggest comms liability is its own headline** — "Quant Engine Port" undersells the only real moat (KIPRIS-native Korean-IP calibration); the fix is reframing, not building.

---

## Key Findings (all repo-grounded at `/Users/chloekang/AlphaNexus`)

1. **The tool is real and the pipeline is live.** Verified: FastAPI app (`/analyze`, `/analyze/json`, `/health`, `/info`); four risk modules (Dispute 40% / Invalidation 35% / Expiry 25% / Trademark) each cited to real literature (Lanjouw & Schankerman 2001; Harhoff, Scherer & Vopel 2003; IP5 lapse data; Trademark Act §34); mock/live KIPRIS switch. **109 tests pass** (1.23s, confirmed). The `37.9/100` demo number is a **bounded calibration assertion** (`test_demo_portfolio_score_approx_37_9`, ±1.0), not measured traction.

2. **Pipeline is live; the data feed is not.** The Render demo runs on **synthetic data** by explicit on-screen disclosure (`합성·예시 데이터`); live KIPRIS results require an unprovisioned `KIPRIS_SERVICE_KEY`. The most common misread — judge/reporter clicks through and hits synthetic numbers after a "screens patent-portfolio risk" headline — is the same inflation failure mode that killed the prior site. Capability ≠ data feed; say both in one breath.

3. **The README polices itself — and that is the strongest asset.** It flags its own weaknesses verbatim: validation set is synthetic, AUC reflects "rank-ordering on designed data, not real-world performance," live mode is a structured stub, production needs calibration against the ~8,000-proceeding KR IPR trial database. Incumbents (PatSnap, Clarivate/Derwent, Questel — **UNVERIFIED as direct comps**) do not advertise this. Lead with the caveat; do not bury it.

4. **The headline is a liability for an IP audience.** README §"Methodology: AlphaNexus Quant Engine Port" reads as elegant lineage to a quant reader but as "a solution hunting for a domain" to KIPRIS judges and IP press, and it risks conflating the product with the old **시장 퀀트 엔진**. The HHI/logistic/bootstrap math stands on its own as sound IP-risk methodology; it does not need the trading-desk origin story on judge/press surfaces.

5. **Crypto/attestation is correctly absent.** Per gate map, Ed25519/attestation is irrelevant to an analytics tool and is commodity regardless. None of it appears in the repo. **Do not invoke it.** The defensible wedge is locality + data depth, not technology.

---

## Team Recommendation

**Reframe the public story from "quant engine ported to patents" → "the first transparently-sourced, KIPRIS-native Korean-IP risk score — every number traces to a published basis, and we tell you exactly where it's still synthetic."** Three concrete moves before any KIPRIS judge or reporter touches the tool:

1. **Pin a status badge** on the demo and every external mention: **"Pipeline live · KIPRIS feed not yet provisioned · figures synthetic."** This forecloses the "fabricated" read and converts the synthetic disclaimer from a credibility leak into a discipline/maturity signal.

2. **Kill the "Quant Engine Port" hook on all judge/investor/press surfaces.** Keep the math; drop the trading-desk lineage. Lead with **Korea-specific IP-data calibration** (KIPRIS-native ingestion, KR ~10% invalidation base-rate, Trademark Act §34, Korean-language TM similarity) — the one line incumbents can't cheaply copy.

3. **Qualify every externally-shown score** with "(synthetic baseline, pending KIPRIS backtest)." Never quote AUC 1.0 or `37.9` as performance without the synthetic-fixture qualifier — under our hard rules an unqualified number becomes fabricated-traction liability with Korean grant reviewers who clawback on inflated TRL.

The honest pre-disclosure of limitations **is** the credibility moat for a solo, pre-entity founder facing reviewers who cross-check. Open the pitch with "here is what is NOT yet real," then the demo.

---

## Top Open Risks

1. **Synthetic-data misread (highest, comms-fatal).** The live demo's synthetic numbers can read as fabricated traction to a judge or reporter who misses the disclaimer. *Mitigation: the pinned status badge above, deployed before July results.* **UNVERIFIED:** no real-data calibration, no users — do not imply otherwise.

2. **Moat is unproven and non-technical.** The code is solo-buildable in weeks; the defensible wedge (KIPRIS-native KR calibration + distribution into IP-screening workflows) requires a real service key, real IPR backtesting, and a first user — **none exist today.** Pre-revenue, pre-entity, MVP, mock-default. The only external proof point is the KIPRIS submission (third-party validation *pending*, **not a win**).

3. **Quant-heritage conflation.** Public "Quant Engine Port" framing invites a "toy / solution-hunting-a-problem" read and blurs the product against the prior 시장 퀀트 엔진. *Mitigation: strip the lineage from all external surfaces; retain it only in internal/engineering docs.*
