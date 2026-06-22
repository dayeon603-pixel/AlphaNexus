"""
Deterministic synthetic portfolio generator for MOCK mode.

Problem this solves: previously, any applicant not in ``FIXTURES`` fell back to
the demo company's portfolio relabelled, so *every* unknown name produced the
identical score. This module instead derives a distinct-but-stable portfolio
from the applicant name, so different inputs yield different (deterministic)
scores — while remaining clearly MOCK data (no live KIPRIS call).

Determinism: seeded from ``sha256(name)``, NOT Python's salted ``hash()``, so the
same name yields the same portfolio across processes, restarts, and the cache.

This is demo/sample data, not real KIPRIS records. Live mode (KIPRIS_SERVICE_KEY
set) returns real per-applicant data; this is the offline fallback.
"""

from __future__ import annotations

import hashlib
import random
from typing import Any

from app.fixtures import ApplicantFixture

__all__ = ["synthesize_applicant"]

_APPLICANT_TYPES: tuple[str, ...] = ("corp", "sme", "univ", "individual")


def _seed_for(name: str) -> int:
    """Stable cross-process seed from the applicant name."""
    digest = hashlib.sha256(name.strip().encode("utf-8")).hexdigest()
    return int(digest[:16], 16)


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _synth_patent(rng: random.Random, idx: int, risk: float) -> dict[str, Any]:
    """One synthetic patent whose fields correlate with the company ``risk``.

    Each patent jitters around the company-level risk so a portfolio has spread
    (non-degenerate concentration), while higher-risk companies trend toward
    high citations / large families / crowded IPC / lapsed status.
    """
    r = _clamp(risk + rng.uniform(-0.18, 0.18), 0.02, 0.98)

    # Most patents are active; risk raises the chance of a lapsed/expired one.
    status = "active"
    remaining_years = round(_clamp(17.0 - r * 13.0 + rng.uniform(-1.5, 1.5), 0.5, 18.0), 1)
    if rng.random() < r * 0.18:
        status = rng.choice(("lapsed", "expired"))
        remaining_years = 0.0

    filing_year = 2024 - int(round(20 - remaining_years)) if remaining_years > 0 else rng.randint(2006, 2012)
    filing_year = max(2005, min(filing_year, 2023))

    return {
        "id": f"KR10-{filing_year}-{rng.randint(0, 9999999):07d}",
        "title": f"특허 포트폴리오 항목 {idx + 1}",
        "forward_citations_pct": round(_clamp(0.18 + r * 0.70 + rng.uniform(-0.08, 0.08), 0.0, 1.0), 2),
        "family_size": max(1, int(round(1 + r * 17 + rng.uniform(-2, 2)))),
        "claim_count": max(3, int(round(5 + r * 35 + rng.uniform(-3, 3)))),
        "applicant_type": rng.choices(_APPLICANT_TYPES, weights=(5, 3, 2, 2))[0],
        "prior_art_density": round(_clamp(0.15 + r * 0.70 + rng.uniform(-0.07, 0.07), 0.0, 1.0), 2),
        "office_action_count": max(0, int(round(1 + r * 7 + rng.uniform(-1, 1)))),
        "ipc_density": round(_clamp(0.12 + r * 0.72 + rng.uniform(-0.07, 0.07), 0.0, 1.0), 2),
        "trial_history": None,  # pre-trial signals only — avoids lookahead (matches fixtures)
        "filing_date": f"{filing_year}-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d}",
        "remaining_years": remaining_years,
        "annuity_year": max(1, min(20, int(round(20 - remaining_years)))),
        "status": status,
    }


def _synth_trademark(rng: random.Random, idx: int, risk: float) -> dict[str, Any]:
    return {
        "id": f"KR40-{rng.randint(2014, 2023)}-{rng.randint(0, 9999999):07d}",
        "title": f"상표 항목 {idx + 1}",
        "similar_group_codes": max(1, int(round(1 + risk * 5 + rng.uniform(-1, 1)))),
        "designated_goods": max(1, int(round(5 + risk * 20 + rng.uniform(-3, 3)))),
        "prior_registration_conflict": rng.random() < risk * 0.6,
        "refusal_history": rng.random() < 0.25 + risk * 0.45,
    }


def synthesize_applicant(applicant_name: str) -> ApplicantFixture:
    """Build a deterministic synthetic portfolio for an unknown applicant.

    Args:
        applicant_name: the typed company/applicant name.

    Returns:
        An ``ApplicantFixture`` with a name-derived set of patents and
        trademarks. Same name in → same portfolio out, every time.
    """
    rng = random.Random(_seed_for(applicant_name))

    # Company-level risk in [0.12, 0.88]; spreads applicants across LOW/MED/HIGH.
    risk = 0.12 + rng.random() * 0.76

    n_patents = rng.randint(1, 5)
    patents = [_synth_patent(rng, i, risk) for i in range(n_patents)]

    n_trademarks = rng.choices((0, 1, 2), weights=(3, 4, 2))[0]
    trademarks = [_synth_trademark(rng, i, risk) for i in range(n_trademarks)]

    return {
        "name": applicant_name,
        "patents": patents,
        "trademarks": trademarks,
    }
