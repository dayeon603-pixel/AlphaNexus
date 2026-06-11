"""
Four IP risk modules for IPScope.

Each module takes a patent/trademark record dict and returns:
    {
        "score": float,           # 0–100 risk score
        "completeness": float,    # 0–1 data-completeness index
        "signals": dict,          # intermediate signal values
        "basis": str,             # one-line academic/statutory citation
    }

Missing inputs reduce completeness (NOT score) and fall back to conservative
population-mean imputation so the score is still meaningful.

All scoring uses the saturate() spine from scoring.py.
"""

import logging
import math
from typing import Any

from app.scoring import clamp, saturate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module weights for patent portfolio aggregate (trademark handled separately)
# ---------------------------------------------------------------------------

PATENT_MODULE_WEIGHTS: dict[str, float] = {
    "dispute": 0.40,
    "invalidation": 0.35,
    "expiry": 0.25,
}

# ---------------------------------------------------------------------------
# Population base-rates / conservative imputations (anchors)
# These are derived from KR KIPRIS population statistics and cited papers.
# ---------------------------------------------------------------------------

# Dispute module anchors
_POP_CITATION_PERCENTILE: float = 0.50   # median cohort-normalised citation rank
_POP_FAMILY_SIZE: int = 3                # median Korean patent family size
_POP_CLAIM_COUNT: int = 8               # median KR patent claim count

# Invalidation module anchors (Harhoff et al. 2003 + KR trial statistics)
_POP_PRIOR_ART_DENSITY: float = 0.40    # fraction of IPC class with ≥1 prior hit
_POP_OA_COUNT: int = 2                  # median KR office-action rounds
_POP_IPC_DENSITY: float = 0.35         # IPC subclass crowding score (0–1)

# Expiry module anchors
_KR_MEDIAN_LAPSE_YEAR: int = 12         # ~50% of KR patents lapse before year 12 (IP5)
_PATENT_TERM_YEARS: int = 20

# Trademark anchors
_POP_SIMILAR_CODES: int = 2             # typical number of similar-goods codes

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

ModuleResult = dict[str, Any]


def _missing_fields(record: dict[str, Any], fields: list[str]) -> list[str]:
    """Return which fields are absent or None in record."""
    return [f for f in fields if record.get(f) is None]


def _completeness(record: dict[str, Any], required: list[str]) -> float:
    """Fraction of required fields that are present and non-None."""
    if not required:
        return 1.0
    present = sum(1 for f in required if record.get(f) is not None)
    return present / len(required)


# ---------------------------------------------------------------------------
# Module 1 — Dispute Risk
# ---------------------------------------------------------------------------

def dispute_module(record: dict[str, Any]) -> ModuleResult:
    """
    Estimate litigation/dispute risk for a single patent.

    Key insight (Lanjouw & Schankerman 2001): the relationship between citation
    count and litigation is an inverted-U. Very low citations → patent is not
    valuable enough to fight over. Very high citations → may be a blocking
    patent with strong claims OR attract invalidity challenges. The middle-high
    range is peak litigation risk.

    We implement this via a quadratic centering:
        citation_signal = -abs(cit_pct - PEAK_PCT) + PEAK_PCT
    so that citations near PEAK_PCT score highest and both tails deflate.

    Other signals:
    - family_size: larger families are more commercially valuable and more
      frequently litigated (Lanjouw & Schankerman 2001 §3).
    - claim_count: more claims → broader scope → higher dispute probability
      (moderate effect, diminishing returns beyond ~20).
    - applicant_type: corporations ('corp') litigate more than individuals
      ('individual') or universities ('univ') — binary adjustment.

    Reliability tiers:
        forward_citations   → 'a' (directly measured)
        family_size         → 'a'
        claim_count         → 'a'
        applicant_type      → 'b' (categorical proxy)

    Args:
        record: Patent dict. Expected keys:
            forward_citations_pct (float 0–1): cohort-normalised citation percentile
            family_size (int): number of patent family members
            claim_count (int): number of independent+dependent claims
            applicant_type (str): 'corp' | 'individual' | 'univ' | 'sme'

    Returns:
        ModuleResult with score, completeness, signals, basis.
    """
    required_fields = ["forward_citations_pct", "family_size", "claim_count", "applicant_type"]
    comp = _completeness(record, required_fields)

    # --- impute missing with population anchors (conservative) ---
    cit_pct: float = record.get("forward_citations_pct") or _POP_CITATION_PERCENTILE
    family_size: int = record.get("family_size") or _POP_FAMILY_SIZE
    claim_count: int = record.get("claim_count") or _POP_CLAIM_COUNT
    applicant_type: str = (record.get("applicant_type") or "corp").lower()

    # --- citation: inverted-U centred at 0.70 (empirically peak litigation band) ---
    # PEAK_PCT = 0.70: patents in 60th–80th citation percentile are most litigated.
    PEAK_PCT: float = 0.70
    citation_raw = -(abs(cit_pct - PEAK_PCT) ** 0.8) * 3.0 + 2.5
    # Shift so neutral (population median at 0.50) → modest positive signal
    citation_signal: float = citation_raw

    # --- family size: log-scaled, anchored so median family → ~0 ---
    family_signal: float = math.log(max(family_size, 1)) - math.log(_POP_FAMILY_SIZE)

    # --- claim count: sqrt-scaled, anchored at population median ---
    claim_signal: float = (math.sqrt(max(claim_count, 1)) - math.sqrt(_POP_CLAIM_COUNT)) * 0.4

    # --- applicant type: empirical bump ---
    APPLICANT_BOOST: dict[str, float] = {
        "corp": 1.2,
        "sme": 0.3,
        "univ": -0.5,
        "individual": -1.0,
    }
    applicant_signal: float = APPLICANT_BOOST.get(applicant_type, 0.0)

    # --- ensemble raw signal (weighted sum, not yet saturated) ---
    # Weights reflect relative empirical evidence strength from L&S 2001
    raw = (
        0.40 * citation_signal
        + 0.30 * family_signal
        + 0.20 * claim_signal
        + 0.10 * applicant_signal
    )

    score = clamp(saturate(raw, k=1.0), 0.0, 100.0)

    signals: dict[str, Any] = {
        "forward_citations_pct": cit_pct,
        "family_size": family_size,
        "claim_count": claim_count,
        "applicant_type": applicant_type,
        "citation_signal": round(citation_signal, 4),
        "family_signal": round(family_signal, 4),
        "claim_signal": round(claim_signal, 4),
        "applicant_signal": applicant_signal,
        "raw_ensemble": round(raw, 4),
        "reliability": "a/b",
    }

    logger.debug("dispute_module: raw=%.3f score=%.1f completeness=%.2f", raw, score, comp)

    return {
        "score": round(score, 2),
        "completeness": round(comp, 3),
        "signals": signals,
        "basis": "Lanjouw & Schankerman (2001) 'The Quality of Ideas' — citation inverted-U, family size, claim breadth",
    }


# ---------------------------------------------------------------------------
# Module 2 — Invalidation Risk
# ---------------------------------------------------------------------------

def invalidation_module(record: dict[str, Any]) -> ModuleResult:
    """
    Estimate inter-partes trial / IPR / invalidity risk.

    Methodology: Harhoff, Scherer & Vopel (2003) show that value-weighted
    citations predict opposition probability. We extend with KR-specific signals:
    prior_art_density, claim_count, office_action_count, IPC crowding, and
    trial_history.

    Anchor: KR IPR trial invalidation base-rate ≈ 8–12% of granted patents.
    We set the logistic zero (50% raw output) well above population to avoid
    over-scoring mundane patents.

    # LOOKAHEAD RISK: trial_history uses trial outcome which is post-grant
    # information. For pre-grant or pre-trial scoring use trial_history=None.

    Signals and reliability:
        prior_art_density    → 'b' (estimated from citation density)
        claim_count          → 'a' (directly countable)
        office_action_count  → 'a' (KIPRIS prosecution history)
        ipc_density          → 'b' (IPC subclass crowding index)
        trial_history        → 'a' if available, else omitted (# LOOKAHEAD RISK)

    Args:
        record: Patent dict. Expected keys:
            prior_art_density (float 0–1): fraction of IPC subclass with cited art
            claim_count (int): total claims
            office_action_count (int): rounds of examination office actions
            ipc_density (float 0–1): crowding index of primary IPC subclass
            trial_history (bool | None): True if patent was previously challenged

    Returns:
        ModuleResult with score, completeness, signals, basis.
    """
    required_fields = [
        "prior_art_density", "claim_count", "office_action_count",
        "ipc_density", "trial_history",
    ]
    comp = _completeness(record, required_fields)

    # --- impute missing ---
    prior_art: float = record.get("prior_art_density") if record.get("prior_art_density") is not None else _POP_PRIOR_ART_DENSITY
    claim_count: int = record.get("claim_count") or _POP_CLAIM_COUNT
    oa_count: int = record.get("office_action_count") if record.get("office_action_count") is not None else _POP_OA_COUNT
    ipc_density: float = record.get("ipc_density") if record.get("ipc_density") is not None else _POP_IPC_DENSITY
    # LOOKAHEAD RISK: trial_history — None means no prior trial data available;
    #   impute with 0 (no history) for prospective / pre-trial scoring.
    trial_history: bool = bool(record.get("trial_history") or False)

    # --- prior art: direct linear signal, anchored at population mean → 0 ---
    prior_art_signal: float = (prior_art - _POP_PRIOR_ART_DENSITY) * 4.0

    # --- claim count: more claims = wider target for invalidation ---
    claim_signal: float = (math.sqrt(max(claim_count, 1)) - math.sqrt(_POP_CLAIM_COUNT)) * 0.5

    # --- office actions: more rounds = more examiner rejections → higher risk ---
    oa_signal: float = (oa_count - _POP_OA_COUNT) * 0.6

    # --- IPC density: crowded art field → higher invalidity probability ---
    ipc_signal: float = (ipc_density - _POP_IPC_DENSITY) * 3.5

    # --- trial history: binary strong signal ---
    trial_signal: float = 3.5 if trial_history else 0.0

    # Baseline offset: anchor at population base-rate (~10%) → saturate(-2.2) ≈ 10%
    # This ensures the average patent scores well below 50, matching the population.
    BASELINE_OFFSET: float = -2.2

    raw = (
        BASELINE_OFFSET
        + 0.30 * prior_art_signal
        + 0.25 * claim_signal
        + 0.20 * oa_signal
        + 0.15 * ipc_signal
        + 0.10 * trial_signal
    )

    score = clamp(saturate(raw, k=1.0), 0.0, 100.0)

    signals: dict[str, Any] = {
        "prior_art_density": prior_art,
        "claim_count": claim_count,
        "office_action_count": oa_count,
        "ipc_density": ipc_density,
        "trial_history": trial_history,
        "prior_art_signal": round(prior_art_signal, 4),
        "claim_signal": round(claim_signal, 4),
        "oa_signal": round(oa_signal, 4),
        "ipc_signal": round(ipc_signal, 4),
        "trial_signal": trial_signal,
        "baseline_offset": BASELINE_OFFSET,
        "raw_ensemble": round(raw, 4),
        "reliability": "a/b",
    }

    logger.debug("invalidation_module: raw=%.3f score=%.1f completeness=%.2f", raw, score, comp)

    return {
        "score": round(score, 2),
        "completeness": round(comp, 3),
        "signals": signals,
        "basis": "Harhoff, Scherer & Vopel (2003); KR IPR base-rate anchor ~10% of granted patents",
    }


# ---------------------------------------------------------------------------
# Module 3 — Expiry / Lapse Risk
# ---------------------------------------------------------------------------

def expiry_module(record: dict[str, Any]) -> ModuleResult:
    """
    Estimate IP value-loss risk from expiry or lapse.

    Based on IP5 statistics: ~50% of KR patents lapse before year 12 (annuity
    non-payment or voluntary abandonment). Risk increases as:
    1. Remaining term shrinks (absolute time horizon).
    2. Annuity year exceeds 12 (historical median lapse point).
    3. Status is LAPSED or EXPIRED (immediate full risk).

    Signals:
        remaining_years (float): years to statutory 20-yr expiry from filing
        annuity_year (int): current annuity year (1–20)
        status (str): 'active' | 'lapsed' | 'expired' | 'pending'

    Reliability:
        remaining_years   → 'a'
        annuity_year      → 'a'
        status            → 'a'

    Args:
        record: Patent dict.

    Returns:
        ModuleResult with score, completeness, signals, basis.
    """
    required_fields = ["remaining_years", "annuity_year", "status"]
    comp = _completeness(record, required_fields)

    remaining_years: float = record.get("remaining_years") if record.get("remaining_years") is not None else 10.0
    annuity_year: int = int(record.get("annuity_year") or 6)
    status: str = (record.get("status") or "active").lower()

    # --- hard override for lapsed/expired ---
    if status in ("lapsed", "expired"):
        return {
            "score": 100.0,
            "completeness": round(comp, 3),
            "signals": {
                "remaining_years": remaining_years,
                "annuity_year": annuity_year,
                "status": status,
                "override": "LAPSED/EXPIRED → maximum expiry risk",
            },
            "basis": "IP5 — KR patent term 20 years; lapsed/expired = full value loss",
        }

    # --- remaining term risk: inverse relationship ---
    # remaining_years=20 → very low risk; remaining_years=0 → maximum risk
    # Signal centred so ~10 remaining years → neutral (0)
    remaining_signal: float = (10.0 - remaining_years) * 0.35

    # --- annuity year risk: exceeding median lapse year (12) increases risk ---
    annuity_signal: float = (annuity_year - _KR_MEDIAN_LAPSE_YEAR) * 0.30

    # --- pending patents: lower expiry risk (grant not yet → term not started) ---
    status_offset: float = -1.0 if status == "pending" else 0.0

    raw = remaining_signal + annuity_signal + status_offset

    score = clamp(saturate(raw, k=1.0), 0.0, 100.0)

    signals: dict[str, Any] = {
        "remaining_years": remaining_years,
        "annuity_year": annuity_year,
        "status": status,
        "remaining_signal": round(remaining_signal, 4),
        "annuity_signal": round(annuity_signal, 4),
        "status_offset": status_offset,
        "raw_ensemble": round(raw, 4),
        "reliability": "a",
    }

    logger.debug("expiry_module: raw=%.3f score=%.1f completeness=%.2f", raw, score, comp)

    return {
        "score": round(score, 2),
        "completeness": round(comp, 3),
        "signals": signals,
        "basis": "IP5 statistics — ~50% of KR patents lapse before year 12; 20-year statutory term",
    }


# ---------------------------------------------------------------------------
# Module 4 — Trademark Risk
# ---------------------------------------------------------------------------

def trademark_module(record: dict[str, Any]) -> ModuleResult:
    """
    Estimate trademark refusal / conflict risk.

    Based on Trademark Act §34 (Korean): a mark is refused if it is confusingly
    similar to a prior registered mark within the same or similar goods/services
    class (similar_group_codes overlap). Refusal history is a strong signal for
    ongoing conflict exposure.

    Signals:
        similar_group_codes (int): number of similar goods/services group codes
        designated_goods (int): breadth of goods/services designation
        prior_registration_conflict (bool): overlap with prior registered mark
        refusal_history (bool): prior KIPRIS office refusal on record

    Reliability:
        similar_group_codes        → 'a'
        designated_goods           → 'a'
        prior_registration_conflict → 'a'
        refusal_history            → 'a'

    Args:
        record: Trademark dict.

    Returns:
        ModuleResult with score, completeness, signals, basis.
    """
    required_fields = [
        "similar_group_codes", "designated_goods",
        "prior_registration_conflict", "refusal_history",
    ]
    comp = _completeness(record, required_fields)

    similar_codes: int = int(record.get("similar_group_codes") or _POP_SIMILAR_CODES)
    designated_goods: int = int(record.get("designated_goods") or 5)
    prior_conflict: bool = bool(record.get("prior_registration_conflict") or False)
    refusal_history: bool = bool(record.get("refusal_history") or False)

    # --- similar codes: more similarity codes = more collision surface ---
    code_signal: float = (similar_codes - _POP_SIMILAR_CODES) * 0.5

    # --- designated goods breadth: wider class = more overlap opportunity ---
    goods_signal: float = math.log(max(designated_goods, 1)) * 0.4

    # --- prior conflict: strong binary signal ---
    conflict_signal: float = 4.0 if prior_conflict else 0.0

    # --- refusal history: indicates examiner already flagged an issue ---
    refusal_signal: float = 3.0 if refusal_history else 0.0

    # Baseline offset anchored so a clean trademark (no conflict, no refusal,
    # median goods breadth) scores ~20 (low risk).
    BASELINE_OFFSET: float = -1.5

    raw = (
        BASELINE_OFFSET
        + 0.20 * code_signal
        + 0.15 * goods_signal
        + 0.40 * conflict_signal
        + 0.25 * refusal_signal
    )

    score = clamp(saturate(raw, k=1.0), 0.0, 100.0)

    signals: dict[str, Any] = {
        "similar_group_codes": similar_codes,
        "designated_goods": designated_goods,
        "prior_registration_conflict": prior_conflict,
        "refusal_history": refusal_history,
        "code_signal": round(code_signal, 4),
        "goods_signal": round(goods_signal, 4),
        "conflict_signal": conflict_signal,
        "refusal_signal": refusal_signal,
        "baseline_offset": BASELINE_OFFSET,
        "raw_ensemble": round(raw, 4),
        "reliability": "a",
    }

    logger.debug("trademark_module: raw=%.3f score=%.1f completeness=%.2f", raw, score, comp)

    return {
        "score": round(score, 2),
        "completeness": round(comp, 3),
        "signals": signals,
        "basis": "Trademark Act §34 (Korea) — prior-registration similarity bar; refusal history anchor",
    }
