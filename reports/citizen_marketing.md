Verified independently: 109 tests, 8 app modules (including the 4 risk modules in `modules.py`), traffic-light HIGH/MED/LOW grading, and the README's own honest synthetic-validation caveat. My specialists' ground truth holds. Here is the team report.

---

# Citizen Marketing — Team Report: AlphaNexus

**TEAM VERDICT:** AlphaNexus is a verified, honest, demoable IP-risk tool with **zero users and no growth loop yet** — the single unlock is one screenshot-native, permalinked "신호등" risk card seeded into Korean indie-founder/변리사 communities, the lane no incumbent serves.

---

## Key Findings (all repo-verified)

**What is real (re-verified by team lead at `/Users/chloekang/AlphaNexus`):**
- Working FastAPI app (`app/main.py`), **109 passing tests**, 8 modules including 4 risk modules (`modules.py`: Dispute / Invalidation / Expiry / Trademark) → 0–100 score + HIGH/MED/LOW traffic light + HTML report.
- Live demo at ipscope.onrender.com (specialists report `/health` 200); mock mode runs with no API key; live KIPRIS behind a service-key switch.
- README is **admirably self-honest**: the validation AUC=1.0 is explicitly flagged as **synthetic, designed-separable fixtures** — *not* a real-world metric.

**What is UNVERIFIED / not real:**
- **Zero users, zero traction** beyond the founder. No real-data proof; every shared report today is mock-flavored.
- AUC=1.0 is **marketing-radioactive** — never surface externally; it reads as fabricated the moment a judge or 변리사 checks.

**Consensus across all four specialists:**
1. **B2B IP-risk is structurally low-virality.** Incumbents (PatSnap, Clarivate/Derwent, Questel — enterprise-priced, attorney-facing) sell via procurement, not loops. There is no consumer trigger for "patent invalidation risk."
2. **The only shareable artifact is the traffic-light report card** — screenshot-native, identity-expressing, zero-friction. The viral mechanic is *the second opinion* (inventor → forwards grade to 변리사/co-founder).
3. **The real lane is distribution**, not crypto (gate confirms Ed25519/attestation is irrelevant and absent here). The moat is owning the **Korean indie-creator / SME-founder / 변리사 community** that incumbents ignore.
4. **No shareable surface exists yet.** Reports are session HTML. Without a persistent, OG-tagged, permalinked card, *there is no loop — only a demo.*

---

## Team Recommendation

**Build ONE consumer-grade wedge and ship it as the public face:**

1. **Strip the quant language.** "saturate / weighted_ensemble / bootstrap_ci / HHI" wins a KIPRIS judge and loses every common user. Lead with the one check a normal person actually wants.
2. **Ship a public, permalinked, OG-image risk card** — `/r/{slug}` — Korean-language, screenshot-native red/yellow/green, with a "run your own name" CTA. This single artifact is what converts the verified demo into a growth loop.
3. **Recommended beachhead: "상표 신호등" (Trademark Traffic-Light).** Type a brand name → red/yellow/green shareable card in ~5 seconds. The trademark module already exists in `app/modules.py`; the trademark check is the one IP question indie makers, 오픈마켓 셀러, and 크라우드펀딩 teams actually search ("이 이름 상표 등록 가능?"). Lowest legal exposure, highest consumer pull.
4. **Frame the share as a self-owned credential** ("우리는 LOW로 나왔어요") — the user supplies their own name and owns the result. This sidesteps the defamation risk of publicly grading named companies (삼성 = HIGH) on synthetic data.
5. **Seed into:** 디스콰이엇, 변리사·1인창업 오픈채팅방, 크라우드펀딩/셀러 카페, 변리사 LinkedIn. KIPRIS submission is the credibility anchor for the first 100.

**Drop:** the pre-generated "ranked gallery of named companies" idea — synthetic data + defamation risk make it legally unsafe and it kills shareability.

---

## Top Open Risks

1. **Synthetic-data credibility cliff (highest).** Until `/analyze` runs **real KIPRIS** on any entered Korean applicant, every shared card is mock-flavored and collapses the instant a 변리사 verifies it. Real-data output is a hard prerequisite for any community push — flipping this live is the gating dependency, not a nice-to-have.
2. **No shareable surface = no loop (build-blocker).** Reports are session HTML today. Without the permalinked, OG-rendered card, all distribution effort returns zero K-factor.
3. **Legal exposure on named results (UNVERIFIED, needs counsel).** Publicly labeling real companies "HIGH risk" on synthetic-tuned scores is a defamation + "not legal advice" liability. The self-owned-card framing mitigates this but is unconfirmed — treat as a constraint, not a solved problem.

*Verification note: core claims re-verified by team lead against the repo (109 tests, modules, README synthetic caveat). User/traction figures are UNVERIFIED and treated as zero. No fabricated metrics surfaced.*
