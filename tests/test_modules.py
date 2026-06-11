"""
Tests for app/modules.py — all four risk modules.
"""

import pytest

from app.modules import (
    PATENT_MODULE_WEIGHTS,
    dispute_module,
    expiry_module,
    invalidation_module,
    trademark_module,
)

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

_FULL_PATENT: dict = {
    "forward_citations_pct": 0.55,
    "family_size": 4,
    "claim_count": 12,
    "applicant_type": "corp",
    "prior_art_density": 0.40,
    "office_action_count": 2,
    "ipc_density": 0.35,
    "trial_history": None,
    "remaining_years": 10.0,
    "annuity_year": 10,
    "status": "active",
}

_FULL_TRADEMARK: dict = {
    "similar_group_codes": 2,
    "designated_goods": 5,
    "prior_registration_conflict": False,
    "refusal_history": False,
}


def _check_result(result: dict) -> None:
    """Assert ModuleResult shape and score bounds."""
    assert "score" in result
    assert "completeness" in result
    assert "signals" in result
    assert "basis" in result
    assert 0.0 <= result["score"] <= 100.0, f"score out of range: {result['score']}"
    assert 0.0 <= result["completeness"] <= 1.0


# ---------------------------------------------------------------------------
# Dispute module
# ---------------------------------------------------------------------------

class TestDisputeModule:
    def test_full_record_returns_valid(self) -> None:
        r = dispute_module(_FULL_PATENT)
        _check_result(r)

    def test_all_missing_returns_valid(self) -> None:
        r = dispute_module({})
        _check_result(r)
        assert r["completeness"] == 0.0

    def test_completeness_partial(self) -> None:
        r = dispute_module({"forward_citations_pct": 0.5, "family_size": 3})
        assert r["completeness"] == pytest.approx(0.5, abs=0.01)

    def test_corp_scores_higher_than_individual(self) -> None:
        base = {
            "forward_citations_pct": 0.55,
            "family_size": 4,
            "claim_count": 10,
        }
        corp_r = dispute_module({**base, "applicant_type": "corp"})
        ind_r = dispute_module({**base, "applicant_type": "individual"})
        assert corp_r["score"] > ind_r["score"]

    def test_larger_family_higher_dispute(self) -> None:
        small = dispute_module({**_FULL_PATENT, "family_size": 1})
        large = dispute_module({**_FULL_PATENT, "family_size": 20})
        assert large["score"] > small["score"]

    def test_basis_string_nonempty(self) -> None:
        r = dispute_module(_FULL_PATENT)
        assert len(r["basis"]) > 10


# ---------------------------------------------------------------------------
# Invalidation module
# ---------------------------------------------------------------------------

class TestInvalidationModule:
    def test_full_record_returns_valid(self) -> None:
        r = invalidation_module(_FULL_PATENT)
        _check_result(r)

    def test_all_missing_returns_valid(self) -> None:
        r = invalidation_module({})
        _check_result(r)
        assert r["completeness"] == 0.0

    def test_trial_history_increases_score(self) -> None:
        no_trial = invalidation_module({**_FULL_PATENT, "trial_history": None})
        with_trial = invalidation_module({**_FULL_PATENT, "trial_history": True})
        assert with_trial["score"] > no_trial["score"]

    def test_high_oa_count_increases_score(self) -> None:
        low_oa = invalidation_module({**_FULL_PATENT, "office_action_count": 0})
        high_oa = invalidation_module({**_FULL_PATENT, "office_action_count": 8})
        assert high_oa["score"] > low_oa["score"]

    def test_baseline_anchors_below_50(self) -> None:
        # Population-average patent should score below 50 (base-rate ~10%)
        avg_patent = {
            "prior_art_density": 0.40,
            "claim_count": 8,
            "office_action_count": 2,
            "ipc_density": 0.35,
            "trial_history": None,
        }
        r = invalidation_module(avg_patent)
        assert r["score"] < 50.0, f"Expected below 50 for average patent, got {r['score']}"

    def test_score_range(self) -> None:
        for _ in range(3):
            r = invalidation_module(_FULL_PATENT)
            assert 0.0 <= r["score"] <= 100.0


# ---------------------------------------------------------------------------
# Expiry module
# ---------------------------------------------------------------------------

class TestExpiryModule:
    def test_lapsed_returns_100(self) -> None:
        r = expiry_module({"status": "lapsed", "remaining_years": 0, "annuity_year": 16})
        assert r["score"] == 100.0

    def test_expired_returns_100(self) -> None:
        r = expiry_module({"status": "expired", "remaining_years": 0, "annuity_year": 20})
        assert r["score"] == 100.0

    def test_full_remaining_low_risk(self) -> None:
        r = expiry_module({"status": "active", "remaining_years": 20.0, "annuity_year": 1})
        assert r["score"] < 30.0, f"Expected low risk for fresh patent, got {r['score']}"

    def test_near_expiry_high_risk(self) -> None:
        r = expiry_module({"status": "active", "remaining_years": 1.0, "annuity_year": 19})
        assert r["score"] > 60.0

    def test_pending_lower_than_active_same_age(self) -> None:
        active = expiry_module({"status": "active", "remaining_years": 10.0, "annuity_year": 10})
        pending = expiry_module({"status": "pending", "remaining_years": 10.0, "annuity_year": 10})
        assert pending["score"] < active["score"]

    def test_all_missing_returns_valid(self) -> None:
        r = expiry_module({})
        _check_result(r)


# ---------------------------------------------------------------------------
# Trademark module
# ---------------------------------------------------------------------------

class TestTrademarkModule:
    def test_full_record_returns_valid(self) -> None:
        r = trademark_module(_FULL_TRADEMARK)
        _check_result(r)

    def test_conflict_increases_score(self) -> None:
        clean = trademark_module({**_FULL_TRADEMARK, "prior_registration_conflict": False})
        conflict = trademark_module({**_FULL_TRADEMARK, "prior_registration_conflict": True})
        assert conflict["score"] > clean["score"]

    def test_refusal_increases_score(self) -> None:
        clean = trademark_module({**_FULL_TRADEMARK, "refusal_history": False})
        refused = trademark_module({**_FULL_TRADEMARK, "refusal_history": True})
        assert refused["score"] > clean["score"]

    def test_all_missing_returns_valid(self) -> None:
        r = trademark_module({})
        _check_result(r)
        assert r["completeness"] == 0.0

    def test_no_conflict_no_refusal_low_score(self) -> None:
        r = trademark_module({
            "similar_group_codes": 1,
            "designated_goods": 3,
            "prior_registration_conflict": False,
            "refusal_history": False,
        })
        # Clean trademark should score below 35 (LOW territory)
        assert r["score"] < 35.0, f"Expected low score for clean TM, got {r['score']}"


# ---------------------------------------------------------------------------
# Module weights
# ---------------------------------------------------------------------------

class TestModuleWeights:
    def test_weights_sum_to_1(self) -> None:
        total = sum(PATENT_MODULE_WEIGHTS.values())
        assert abs(total - 1.0) < 1e-9

    def test_all_weights_positive(self) -> None:
        for name, w in PATENT_MODULE_WEIGHTS.items():
            assert w > 0, f"weight for '{name}' is not positive"
