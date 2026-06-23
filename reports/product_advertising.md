This cwd is NOT AlphaNexus — it's "veracity" (asvspoof/bonafide = audio anti-spoofing, a different project). The real AlphaNexus repos are at `/Users/chloekang/AlphaNexus` and the daily_work scaffold. The specialists already verified against the correct AlphaNexus repo. I'll ground my synthesis on their verified findings (which are internally consistent: real FastAPI app, 109 tests, mock-by-default, live Render demo, no traction/entity/revenue). I have enough to synthesize.

---

# Product Advertising — Team Report: AlphaNexus

**TEAM VERDICT (1 line):** Spend **$0 on paid acquisition** now — AlphaNexus is a demoable product, not yet an advertisable claim; the gap is distribution-readiness and entity, not ad budget.

---

## Key Findings (grounded)

**Product is real, traction is not.** Verified across specialists: working FastAPI app (~2,300 LOC, 8 modules), **109 passing tests**, a ported scoring engine, traffic-light HIGH/MED/LOW output with a 0–100 score + HTML report, live demo at **ipscope.onrender.com** (health/info responding). README is honest about **synthetic validation**. KIPRIS 지식재산 대회 submitted **2026-06-11**, results July 2026.

**The load-bearing constraint: the deployed demo runs `data_source: KIPRIS (mock)`.** It serves **6 hardcoded fixture applicants** (e.g., 삼정테크 → LOW ~37.9, 글로벌IP홀딩스 → HIGH); unknown names fall back to a demo result. Live KIPRIS needs a self-supplied API key and is a **structured stub, UNVERIFIED against real KIPRIS records**. The retrospective AUC validation harness exists but **real AUC is an unshipped M3 deliverable** — there is no validated accuracy number to advertise.

**Status (UNVERIFIED traction):** no users, no revenue, no entity (no 사업자등록), no auth, no PII handling, no signup/email-capture/pricing page.

**Three independent reasons paid acquisition has negative expected ROI:**
1. **No conversion endpoint** — paid traffic dead-ends on a fixture-scoring demo form; nothing to capture, nurture, or retarget. CAC ≈ 100% waste.
2. **Mock-data demo destroys trust at the buyer's first touch** — a 변리사 typing a real client name and getting a fallback fixture is a credibility loss, and a real-data claim in copy would be a takedown risk.
3. **Pre-entity = can't transact** — no payment rail, no invoiceable B2B sale, and Meta/Google increasingly require business verification to run ads.

**Channel reality:** the buyer (변리사 / corporate IP counsel / TTOs) is a narrow, high-trust, low-volume B2B audience with no creator economy and thin paid-search intent volume. This is an **SEO + warm-outbound + KIPRIS-credential** market — broad paid social is the exact "narrow audience" failure pattern flagged in prior venues.

---

## Team Recommendation

**Kill the paid-acquisition line entirely.** Sequence the only justified spend:

1. **Fix distribution-readiness BEFORE any media** — (a) wire the demo to **live KIPRIS** so a typed name returns real data, and (b) add **one email-capture CTA** on the report ("get the full PDF report"). Until a real query returns real data and captures a contact, paid traffic is lighting money on fire.
2. **Build exactly ONE creative asset** — a 6–8s screen-capture loop (paste applicant → traffic-light grade snaps in → report scrolls), using **fixture applicants only** until live data ships. Repurposable across LinkedIn, organic, landing page.
3. **The only defensible "paid" dollar** — a sub-$10/day **brand-search defense + retargeting/pixel-warming** holding campaign so organic visitors (KIPRIS judges, design partners, professors you email) get re-touched and "AlphaNexus/ipscope" isn't poached. (UNVERIFIED budget band — adjust to actual demo traffic.)
4. **Real channel = founder-led distribution** — LinkedIn targeting KR 변리사 / in-house IP counsel + direct outreach, earning credibility from the **KIPRIS 대회 result in July**. No accuracy/savings/"trusted by" claims until a validated number or an LOI exists.

---

## Top Open Risks

1. **Claim risk (highest):** any ad implying real-data screening or accuracy is unsupportable today (mock default, AUC unbuilt, synthetic validation) and reputationally toxic in a legal-adjacent niche. Hard gate: no metric in copy until M3 AUC ships.
2. **Distribution + entity, not budget, is the bottleneck:** pre-entity means no payment rail and ad-platform business-verification blocks; spending now pays to send strangers to something they can't buy. Moat must be the **변리사 data/distribution channel**, not crypto (Ed25519/hash-chain is commodity and not core here).
3. **Demo-trust cliff:** the live-mode/fixture gap means the first serious buyer query likely returns a fallback — amplifying any acquisition spend into a credibility loss. Closing live-KIPRIS is the precondition for *all* downstream marketing.

*Note: the orchestrator's cwd (`/Users/chloekang/ventures/veracity`) is a different project (audio anti-spoofing), not AlphaNexus. Specialist findings were grounded against the actual AlphaNexus repo at `/Users/chloekang/AlphaNexus` + `/Users/chloekang/Documents/daily_work/AlphaNexus` and the live demo; this synthesis relies on those verified findings.*
