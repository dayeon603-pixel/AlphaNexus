"""
Tests for app/scoring.py — scoring spine.
"""

import math

import pytest

from app.scoring import (
    RELIABILITY_SIGMA,
    bootstrap_ci,
    clamp,
    concentration_adjust,
    saturate,
    weighted_ensemble,
)


class TestSaturate:
    def test_midpoint(self) -> None:
        assert abs(saturate(0.0) - 50.0) < 1e-9

    def test_large_positive_approaches_100(self) -> None:
        assert saturate(100.0) > 99.9

    def test_large_negative_approaches_0(self) -> None:
        assert saturate(-100.0) < 0.1

    def test_output_in_range(self) -> None:
        for x in [-10, -1, 0, 1, 10]:
            v = saturate(float(x))
            assert 0.0 <= v <= 100.0

    def test_steepness_k(self) -> None:
        v_steep = saturate(1.0, k=3.0)
        v_flat = saturate(1.0, k=0.1)
        assert v_steep > v_flat


class TestClamp:
    def test_within_range(self) -> None:
        assert clamp(50.0, 0.0, 100.0) == 50.0

    def test_below_lo(self) -> None:
        assert clamp(-5.0, 0.0, 100.0) == 0.0

    def test_above_hi(self) -> None:
        assert clamp(105.0, 0.0, 100.0) == 100.0

    def test_exact_boundary(self) -> None:
        assert clamp(0.0, 0.0, 100.0) == 0.0
        assert clamp(100.0, 0.0, 100.0) == 100.0


class TestWeightedEnsemble:
    def test_equal_weights_is_mean(self) -> None:
        subs = {"a": 30.0, "b": 70.0}
        weights = {"a": 1.0, "b": 1.0}
        assert abs(weighted_ensemble(subs, weights) - 50.0) < 1e-9

    def test_single_subscore(self) -> None:
        assert weighted_ensemble({"x": 42.0}, {"x": 0.5}) == 42.0

    def test_unnormalized_weights(self) -> None:
        # Should normalize: a weight=3 vs b weight=1 → 3/4 * 20 + 1/4 * 100 = 40
        result = weighted_ensemble({"a": 20.0, "b": 100.0}, {"a": 3.0, "b": 1.0})
        assert abs(result - 40.0) < 1e-6

    def test_output_clamped_to_range(self) -> None:
        result = weighted_ensemble({"x": 200.0}, {"x": 1.0})
        assert result == 100.0

    def test_empty_raises(self) -> None:
        with pytest.raises(ValueError, match="non-empty"):
            weighted_ensemble({}, {"x": 1.0})

    def test_zero_weight_sum_raises(self) -> None:
        with pytest.raises(ValueError, match="zero"):
            weighted_ensemble({"x": 50.0}, {"y": 1.0})

    def test_negative_weight_raises(self) -> None:
        with pytest.raises(ValueError, match="non-negative"):
            weighted_ensemble({"x": 50.0}, {"x": -1.0})


class TestConcentrationAdjust:
    def test_single_item_no_penalty(self) -> None:
        result = concentration_adjust([42.0])
        assert abs(result - 42.0) < 1e-6

    def test_uniform_scores_no_meaningful_penalty(self) -> None:
        # Perfectly uniform distribution → HHI == 1/N → no excess concentration
        uniform = [50.0, 50.0, 50.0, 50.0]
        result = concentration_adjust(uniform)
        # Should equal naive mean (no penalty when uniform)
        assert abs(result - 50.0) < 0.1

    def test_concentrated_scores_penalised(self) -> None:
        # One dominant high-risk patent should push score above naive mean
        concentrated = [90.0, 10.0, 10.0, 10.0]
        naive_mean = sum(concentrated) / len(concentrated)  # 30.0
        result = concentration_adjust(concentrated)
        assert result >= naive_mean  # concentration penalty only adds upward

    def test_output_clamped(self) -> None:
        result = concentration_adjust([100.0, 100.0, 100.0])
        assert 0.0 <= result <= 100.0

    def test_empty_raises(self) -> None:
        with pytest.raises(ValueError, match="non-empty"):
            concentration_adjust([])

    def test_all_zero_scores(self) -> None:
        result = concentration_adjust([0.0, 0.0, 0.0])
        assert result == 0.0


class TestBootstrapCI:
    def test_output_structure(self) -> None:
        lo, hi = bootstrap_ci(50.0, "b")
        assert isinstance(lo, float)
        assert isinstance(hi, float)

    def test_lo_le_hi(self) -> None:
        for tier in ("a", "b", "c"):
            lo, hi = bootstrap_ci(50.0, tier)
            assert lo <= hi, f"tier={tier}: lo={lo} > hi={hi}"

    def test_output_clamped_to_0_100(self) -> None:
        lo, hi = bootstrap_ci(2.0, "c")   # sigma=15, might hit 0
        assert lo >= 0.0
        hi2, _ = bootstrap_ci(98.0, "c"), None
        lo3, hi3 = bootstrap_ci(98.0, "c")
        assert hi3 <= 100.0

    def test_deterministic(self) -> None:
        r1 = bootstrap_ci(60.0, "b", seed=42)
        r2 = bootstrap_ci(60.0, "b", seed=42)
        assert r1 == r2

    def test_different_seeds_differ(self) -> None:
        r1 = bootstrap_ci(60.0, "b", seed=1)
        r2 = bootstrap_ci(60.0, "b", seed=999)
        assert r1 != r2

    def test_wider_ci_for_lower_reliability(self) -> None:
        lo_a, hi_a = bootstrap_ci(50.0, "a")
        lo_c, hi_c = bootstrap_ci(50.0, "c")
        width_a = hi_a - lo_a
        width_c = hi_c - lo_c
        assert width_c > width_a

    def test_invalid_tier_raises(self) -> None:
        with pytest.raises(ValueError, match="reliability"):
            bootstrap_ci(50.0, "x")  # type: ignore[arg-type]
