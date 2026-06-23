The contracts specialist's flag is verified: the LICENSE is a quant-trading license ("Financial Use", "trading", "signal generation", "alpha extraction", $250k liquidated damages at §9.2) bolted onto an IP-risk product. This is a genuine, material red flag. The core facts across all four specialists are consistent and grounded. I have what I need.

---

# Legal / Regulatory Team Report — AlphaNexus (Division D)

**TEAM VERDICT:** Real, honestly-built MVP — but **uninvestable and unsellable as-is**: the binding constraints are KIPRIS data-redistribution rights and a copy-pasted quant-trading LICENSE, not the code.

---

## Key Findings

**The product is real (verified, repo `/Users/chloekang/AlphaNexus`).** FastAPI app, four risk modules (Dispute / Invalidation / Expiry / Trademark), 109/109 tests passing, mock-by-default with a live KIPRIS switch gated behind `KIPRIS_SERVICE_KEY`. README is unusually honest: scoring is tuned on **synthetic fixtures**, validation AUC=1.0 is self-captioned as rank-ordering on *designed-separable* data, **not** real-world performance. This is an MVP, not vaporware. **UNVERIFIED:** real-data accuracy (live KIPRIS path is wired but never exercised against a real key — a "structured stub" not hit by any test).

**Three gating legal facts, in priority order:**

1. **KIPRIS data rights are the whole business model — and are unconfirmed.** All four specialists independently converged here. The product's value depends entirely on KIPRIS Plus / KIPRIS Open API data, governed by 한국특허정보원(KIPI) terms that typically restrict **commercial redistribution and resale of derived data**. A scored-risk report derived from KIPRIS records is plausibly a "derived work" needing a separate 정보이용계약 / commercial data license. **UNVERIFIED** until the actual KIPRIS Plus 이용약관 is read. *This single answer determines whether AlphaNexus is a licensable product or a permanent demo.*

2. **The LICENSE is a liability, not an asset (verified directly).** The committed `LICENSE` is a *quant-trading* "Proprietary Systems License v1.0" — it defines and bars "Financial Use" (trading, signal generation, alpha extraction, portfolio management), presumes any later similar system is "Derivative," and sets **§9.2 liquidated damages of min USD $250,000 or 3× gain**. It does not describe an IP-risk SaaS at all. To KIPRIS judges, pilots, or investors it reads as copy-paste, and is facially overbroad / likely unenforceable under Korean law. Must be deleted and replaced before any external party reads it.

3. **No entity = no contracting capacity, and no liability shield.** A pre-entity solo founder cannot sign a KIPRIS data-use agreement, a pilot NDA, or a B2B SaaS contract. The "not legal advice" disclaimer is necessary but thin: a score labeling a named applicant "HIGH" risk is a foreseeable-reliance / defamation / tortious-interference vector in Korea, and prescriptive "should you file?" output brushes 변리사법 (Patent Attorney Act) scope-of-practice. Keep output strictly **descriptive**, never prescriptive.

**Moat (legal lens):** Per the gate map, it is **not** the crypto (correctly absent — no Ed25519) and **not** the scoring math (a commodity ported logistic ensemble + HHI + bootstrap CI, non-novel, likely unpatentable). The only defensible asset is **KIPRIS data-access standing + calibration depth against the real KR IPR trial corpus (~8,000 proceedings)** — and both sit behind the same KIPI relationship.

---

## Team Recommendation

**Sequence, do not parallelize the entity rush:**

1. **Before pricing or incorporating anything:** get written confirmation from KIPI on whether commercial redistribution of KIPRIS-derived risk scores requires a 정보이용계약. This gates everything downstream.
2. **Immediately, regardless of #1:** delete the quant-trading LICENSE; replace with a clean dual posture (proprietary "all rights reserved" + a SaaS ToS stub with limitation-of-liability and "informational only / no attorney relationship" clauses). This is a competition-hygiene issue *now* — judges may read the repo.
3. **Do NOT incorporate yet.** KIPRIS contest submission needs no entity. Form a 개인사업자/1인 법인 only when (a) the KIPI redistribution answer is "yes," or (b) a paying pilot or prize requires it — then assign copyright + license to the entity, not the person.
4. Keep all model output descriptive (signal scores), never prescriptive filing advice.

---

## Top Open Risks

1. **KIPRIS redistribution rights (CRITICAL, UNVERIFIED).** If KIPI prohibits commercial resale of derived scores, there is no lawful product — only a demo. Resolve before any spend.
2. **LICENSE mismatch (HIGH, VERIFIED).** Live quant-trading license with $250k damages clause on an IP product signals copy-paste and is unenforceable; reputational + legal exposure with judges and any counterparty until replaced.
3. **Output-liability + scope-of-practice (MEDIUM).** "HIGH risk" on a named entity invites defamation/reliance claims; prescriptive advice risks 변리사법. Mitigated only by a real ToS (needs entity) and strictly descriptive output.

*Note (internal only): all constraints above are amplified by the solo, pre-entity, pre-revenue posture — dev is not the bottleneck; data rights + entity are.*
