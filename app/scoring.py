"""
Scoring spine for AlphaNexus.

Methodology: Ported from AlphaNexus quant engine — logistic signal saturation,
normalized ensemble weighting, Herfindahl concentration penalty, and seeded
bootstrap confidence intervals.

All functions are pure (no side-effects), deterministic, and fully type-hinted.
"""

import math
import logging
from typing import Union

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Reliability tier → approximate sigma for bootstrap perturbation
RELIABILITY_SIGMA: dict[str, float] = {
    "a": 2.0,   # empirical / direct measurement
    "b": 8.0,   # heuristic / industry rule-of-thumb
    "c": 15.0,  # proxy / imputed / low-quality signal
}

BOOTSTRAP_CI_LEVEL: float = 0.90  # 90% CI
HERFINDAHL_PENALTY_WEIGHT: float = 0.12  # scales the concentration upward adjustment


# ---------------------------------------------------------------------------
# Core primitives
# ---------------------------------------------------------------------------

def saturate(x: float, k: float = 1.0) -> float:
    """
    Map a raw signal to [0, 100] via a logistic (sigmoid) function.

    Formula: 100 / (1 + exp(-k * x))

    x = 0 → 50.0 (neutral mid-point)
    Large positive x → approaches 100 (high risk)
    Large negative x → approaches 0 (low risk)

    Args:
        x: Raw signal value, centred around 0 for a neutral read.
        k: Steepness of the logistic curve. Default 1.0.

    Returns:
        Float in [0, 100].
    """
    return 100.0 / (1.0 + math.exp(-k * x))


def clamp(v: float, lo: float, hi: float) -> float:
    """
    Clamp v to [lo, hi].

    Args:
        v: Value to clamp.
        lo: Lower bound (inclusive).
        hi: Upper bound (inclusive).

    Returns:
        Float in [lo, hi].
    """
    return max(lo, min(hi, v))


def weighted_ensemble(
    subscores: dict[str, float],
    weights: dict[str, float],
) -> float:
    """
    Compute a normalized weighted sum of subscores.

    Weights do NOT need to sum to 1 — they are normalized internally so the
    result is always meaningful even if a module is absent.

    Args:
        subscores: Module name → score in [0, 100].
        weights: Module name → raw weight (positive floats).

    Returns:
        Weighted average in [0, 100].

    Raises:
        ValueError: If subscores is empty or no matching weight is found.
    """
    if not subscores:
        raise ValueError("subscores must be non-empty")

    total_weight: float = 0.0
    weighted_sum: float = 0.0

    for name, score in subscores.items():
        w = weights.get(name, 0.0)
        if w < 0:
            raise ValueError(f"Weight for '{name}' must be non-negative, got {w}")
        weighted_sum += score * w
        total_weight += w

    if total_weight == 0.0:
        raise ValueError("Sum of matched weights is zero — check weight keys vs subscore keys")

    result = weighted_sum / total_weight
    return clamp(result, 0.0, 100.0)


def concentration_adjust(scores: list[float]) -> float:
    """
    Portfolio aggregate = weighted mean of per-patent scores with a Herfindahl
    concentration penalty.

    Rationale: a portfolio dominated by one high-risk patent is more exposed
    than a diverse portfolio with the same naive mean.  The Herfindahl-Hirschman
    Index (HHI) of the score distribution (treated as a share vector) captures
    this concentration.  We add a fraction of the excess-HHI over the baseline
    uniform-portfolio HHI as an upward adjustment to the mean.

    HHI baseline (uniform N patents) = 1/N.
    Excess = HHI_actual - 1/N  (clamped at 0 so we never penalise below mean).
    Adjustment = HERFINDAHL_PENALTY_WEIGHT * excess * 100.

    Args:
        scores: List of per-patent risk scores in [0, 100].

    Returns:
        Portfolio risk score in [0, 100] with concentration adjustment.

    Raises:
        ValueError: If scores list is empty.
    """
    if not scores:
        raise ValueError("scores list must be non-empty")

    n = len(scores)
    mean_score = sum(scores) / n

    if n == 1:
        # Single patent — no diversification possible, no adjustment needed.
        return clamp(mean_score, 0.0, 100.0)

    # Normalise scores to a share vector summing to 1 (handle all-zero edge case).
    total = sum(scores)
    if total == 0.0:
        return 0.0

    shares = [s / total for s in scores]
    hhi_actual = sum(sh ** 2 for sh in shares)
    hhi_uniform = 1.0 / n

    excess_concentration = max(0.0, hhi_actual - hhi_uniform)
    adjustment = HERFINDAHL_PENALTY_WEIGHT * excess_concentration * 100.0

    result = mean_score + adjustment
    logger.debug(
        "concentration_adjust: mean=%.2f hhi=%.4f uniform_hhi=%.4f excess=%.4f adj=%.2f result=%.2f",
        mean_score, hhi_actual, hhi_uniform, excess_concentration, adjustment, result,
    )
    return clamp(result, 0.0, 100.0)


def bootstrap_ci(
    point: float,
    reliability: str,
    n: int = 1000,
    seed: int = 42,
) -> tuple[float, float]:
    """
    Compute a seeded 90% bootstrap confidence interval around a point estimate.

    Simulates N perturbed draws from a normal distribution centred on `point`
    with sigma determined by the reliability tier, then returns the 5th and
    95th percentiles clamped to [0, 100].

    Reliability tiers:
      'a' — empirical / direct measurement       → sigma=2
      'b' — heuristic / industry rule-of-thumb   → sigma=8
      'c' — proxy / imputed / low-quality signal → sigma=15

    Args:
        point: Point estimate of risk score in [0, 100].
        reliability: One of 'a', 'b', 'c'.
        n: Number of bootstrap samples. Default 1000.
        seed: RNG seed for reproducibility. Default 42.

    Returns:
        Tuple (lo, hi) in [0, 100].

    Raises:
        ValueError: If reliability tier is not one of 'a', 'b', 'c'.
    """
    if reliability not in RELIABILITY_SIGMA:
        raise ValueError(
            f"reliability must be one of {list(RELIABILITY_SIGMA)}, got '{reliability}'"
        )

    sigma = RELIABILITY_SIGMA[reliability]
    rng = np.random.default_rng(seed)
    samples = rng.normal(loc=point, scale=sigma, size=n)
    samples = np.clip(samples, 0.0, 100.0)

    alpha = 1.0 - BOOTSTRAP_CI_LEVEL
    lo = float(np.percentile(samples, alpha / 2 * 100))
    hi = float(np.percentile(samples, (1 - alpha / 2) * 100))
    return clamp(lo, 0.0, 100.0), clamp(hi, 0.0, 100.0)
