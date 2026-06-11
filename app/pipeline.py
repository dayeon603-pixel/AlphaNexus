"""
Core analysis pipeline for AlphaNexus.

Separates pipeline logic from HTTP transport so it can be called
directly from tests, CLI scripts, and the API layer.
"""

import logging
from typing import Any

from app.modules import (
    PATENT_MODULE_WEIGHTS,
    dispute_module,
    expiry_module,
    invalidation_module,
    trademark_module,
)
from app.scoring import (
    bootstrap_ci,
    concentration_adjust,
    weighted_ensemble,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Traffic-light thresholds (tunable, deterministic)
# ---------------------------------------------------------------------------

GRADE_THRESHOLDS: dict[str, float] = {
    "HIGH": 60.0,   # score >= 60 → HIGH risk
    "MED": 40.0,    # 40 <= score < 60 → MED risk
    # < 40 → LOW risk
}

APP_VERSION: str = "0.1.0"
APP_NAME: str = "AlphaNexus"


def grade_portfolio(score: float) -> str:
    """
    Map a 0–100 portfolio score to a traffic-light grade.

    Args:
        score: Portfolio risk score.

    Returns:
        'HIGH', 'MED', or 'LOW'.
    """
    if score >= GRADE_THRESHOLDS["HIGH"]:
        return "HIGH"
    if score >= GRADE_THRESHOLDS["MED"]:
        return "MED"
    return "LOW"


def analyze_patent(patent: dict[str, Any]) -> dict[str, Any]:
    """
    Run all applicable modules on a single patent record.

    Args:
        patent: Patent dict (see fixtures.py for schema).

    Returns:
        Dict with per-module results, weighted aggregate, CI, and patent metadata.
    """
    d_result = dispute_module(patent)
    i_result = invalidation_module(patent)
    e_result = expiry_module(patent)

    subscores: dict[str, float] = {
        "dispute": d_result["score"],
        "invalidation": i_result["score"],
        "expiry": e_result["score"],
    }

    agg_score = weighted_ensemble(subscores, PATENT_MODULE_WEIGHTS)

    # Use the lowest reliability tier among modules for the CI
    ci_lo, ci_hi = bootstrap_ci(agg_score, reliability="b")

    # Aggregate completeness = mean of module completeness scores
    completeness = round(
        (d_result["completeness"] + i_result["completeness"] + e_result["completeness"]) / 3.0,
        3,
    )

    return {
        "id": patent.get("id", "UNKNOWN"),
        "title": patent.get("title", ""),
        "type": "patent",
        "scores": subscores,
        "aggregate": round(agg_score, 2),
        "ci": (round(ci_lo, 2), round(ci_hi, 2)),
        "completeness": completeness,
        "module_results": {
            "dispute": d_result,
            "invalidation": i_result,
            "expiry": e_result,
        },
    }


def analyze_trademark(trademark: dict[str, Any]) -> dict[str, Any]:
    """
    Run trademark module on a single trademark record.

    Args:
        trademark: Trademark dict (see fixtures.py for schema).

    Returns:
        Dict with module result, CI, and trademark metadata.
    """
    tm_result = trademark_module(trademark)
    score = tm_result["score"]
    ci_lo, ci_hi = bootstrap_ci(score, reliability="b")

    return {
        "id": trademark.get("id", "UNKNOWN"),
        "title": trademark.get("title", ""),
        "type": "trademark",
        "scores": {"trademark": score},
        "aggregate": score,
        "ci": (round(ci_lo, 2), round(ci_hi, 2)),
        "completeness": tm_result["completeness"],
        "module_results": {"trademark": tm_result},
    }


def run_pipeline(applicant_data: dict[str, Any]) -> dict[str, Any]:
    """
    Run the full AlphaNexus pipeline for one applicant.

    Args:
        applicant_data: ApplicantFixture dict with 'name', 'patents', 'trademarks'.

    Returns:
        Full analysis result dict suitable for JSON serialization and HTML rendering.
    """
    name: str = applicant_data.get("name", "Unknown")
    patents: list[dict[str, Any]] = applicant_data.get("patents", [])
    trademarks: list[dict[str, Any]] = applicant_data.get("trademarks", [])

    patent_analyses = [analyze_patent(p) for p in patents]
    trademark_analyses = [analyze_trademark(tm) for tm in trademarks]

    all_analyses = patent_analyses + trademark_analyses

    # Portfolio score: concentration_adjust over all per-IP aggregates
    if all_analyses:
        per_ip_scores = [a["aggregate"] for a in all_analyses]
        portfolio_score = round(concentration_adjust(per_ip_scores), 2)
    else:
        portfolio_score = 0.0
        logger.warning("No patents or trademarks found for applicant '%s'", name)

    grade = grade_portfolio(portfolio_score)
    ci_lo, ci_hi = bootstrap_ci(portfolio_score, reliability="b")

    # Overall data completeness = mean across all IP items
    if all_analyses:
        overall_completeness = round(
            sum(a["completeness"] for a in all_analyses) / len(all_analyses), 3
        )
    else:
        overall_completeness = 0.0

    result: dict[str, Any] = {
        "applicant": name,
        "portfolio_score": portfolio_score,
        "grade": grade,
        "ci": (round(ci_lo, 2), round(ci_hi, 2)),
        "overall_completeness": overall_completeness,
        "patent_count": len(patents),
        "trademark_count": len(trademarks),
        "patent_analyses": patent_analyses,
        "trademark_analyses": trademark_analyses,
        "weights": PATENT_MODULE_WEIGHTS,
        "grade_thresholds": GRADE_THRESHOLDS,
        "app_name": APP_NAME,
        "app_version": APP_VERSION,
    }

    logger.info(
        "Pipeline complete: applicant='%s' score=%.2f grade=%s completeness=%.3f",
        name, portfolio_score, grade, overall_completeness,
    )
    return result
