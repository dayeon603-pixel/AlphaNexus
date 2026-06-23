# AlphaNexus — TA Team Report (Division D)

**Team verdict:** Working solo-built MVP (verified), but pre-entity / pre-revenue — open zero reqs; the one role to draft is a fractional 변리사 advisor, contingent on KIPRIS validation + entity formation.

---

## Key Findings

**Repo is real, traction is not.** Verified working FastAPI MVP: four risk modules (dispute / invalidation / expiry / trademark), a quant-ported scoring spine (logistic saturation, weighted ensemble, HHI concentration penalty, seeded bootstrap CI), passing test suite, live Render demo. The build is genuine and tested — not vaporware.

**But the data and outcomes are not validated.** Scoring is deterministic heuristics anchored to IP-economics literature, not ML trained on labeled dispute outcomes. The live KIPRIS path is wired but effectively a stub; validation AUC runs on synthetic/placeholder labels and is self-admitted to reflect "rank-ordering on designed data, not real-world performance." Several KIPRIS endpoints are flagged `# UNVERIFIED` in the repo itself. **All traction, users, revenue, and the KIPRIS contest result are UNVERIFIED** (results July 2026).

**The constraint is not engineering.** Per the gate map, the binding constraints are **entity formation** and **distribution / data depth** into IP analytics (incumbents PatSnap, Clarivate/Derwent, Questel, IPRally hold proprietary corpora the heuristic engine lacks). One developer already covers the build; headcount is not the bottleneck.

**ACAMS / AML sourcing is a category error.** ACAMS is anti-money-laundering compliance — zero overlap with patent/IP analytics. That pool belongs to the attestation rail, not this product. Correct pools (for later): 변리사 networks, KIPRIS/IP5 data engineers, KISTA, and IP-analytics PMs from PatSnap/Clarivate/Questel-adjacent backgrounds.

---

## Team Recommendation

**Freeze all external hiring and sourcing. Open zero reqs now.** Recruiting into a pre-entity, pre-revenue, solo project — no legal employer (사업자등록 missing), no comp budget, no equity vehicle — would burn recruiter credibility and dilute a pre-seed cap table against an unvalidated tool.

**Draft exactly one role, held as DRAFT in the pipeline:** a **fractional / advisory 변리사 (Korean patent attorney) or IP-data design-partner**, comped equity-light (band UNVERIFIED — derive from a real 409A once an entity exists, not now). This role validates scoring constants against the real KR IPR trial corpus, converts the UNVERIFIED endpoints and synthetic labels into a legally-disclaimed methodology, and opens KIPO / law-firm / 기술지주 / TLO distribution. That is the moat input (data depth + credibility), not labor.

**Trigger to activate the role:** (1) KIPRIS result validates the wedge (July 2026) AND (2) entity registered. Until then, TA's deliverable is a passive sourcing map (10–15 변리사 + KIPRIS-data engineers + IP-analytics PMs), not a live 공고. This is a founder-BD problem, not a sourcing one.

---

## Top Open Risks

1. **No legal employer / no comp vehicle.** Pre-entity and pre-revenue means there is literally no one to hire into and nothing to pay with. Any 공고 now is theater and a credibility leak. Mitigation: gate all hiring behind entity formation.

2. **Validation gap = no credible pitch for talent or data partners.** Synthetic labels, stub KIPRIS path, and UNVERIFIED endpoints mean the product hasn't touched a live IPR record. Senior 변리사 / IP-data partners will not engage an unvalidated heuristic. Mitigation: the first advisory hire exists specifically to close this — chicken-and-egg, so it must be founder-BD led until KIPRIS gives a signal.

3. **Distribution + data moat unproven against incumbents.** PatSnap/Clarivate/Questel/IPRally hold the proprietary corpora; a heuristic engine over public KIPRIS data has no defensible moat yet (Ed25519/crypto framing does not apply here). Mitigation: structure the first non-founder engagement around a data partnership / firm pilot, not engineering headcount.
