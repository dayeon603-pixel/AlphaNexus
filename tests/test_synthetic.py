"""Tests for the deterministic synthetic mock generator."""

from __future__ import annotations

from app.fixtures import FIXTURES
from app.kipris_client import KiprisClient
from app.pipeline import run_pipeline
from app.synthetic import synthesize_applicant

_PATENT_KEYS = {
    "id", "title", "forward_citations_pct", "family_size", "claim_count",
    "applicant_type", "prior_art_density", "office_action_count", "ipc_density",
    "trial_history", "filing_date", "remaining_years", "annuity_year", "status",
}


def test_same_name_is_deterministic():
    a = synthesize_applicant("테스트회사")
    b = synthesize_applicant("테스트회사")
    assert a == b


def test_different_names_differ():
    a = synthesize_applicant("회사A")
    b = synthesize_applicant("회사B")
    assert a != b


def test_schema_is_valid():
    pf = synthesize_applicant("스키마검증 주식회사")
    assert pf["name"] == "스키마검증 주식회사"
    assert 1 <= len(pf["patents"]) <= 5
    for p in pf["patents"]:
        assert _PATENT_KEYS <= set(p), f"missing keys: {_PATENT_KEYS - set(p)}"
        assert 0.0 <= p["forward_citations_pct"] <= 1.0
        assert p["family_size"] >= 1
        assert p["trial_history"] is None  # pre-trial only — no lookahead


def test_distinct_names_yield_distinct_scores():
    client = KiprisClient(mode="mock")
    names = ["삼성전자", "현대자동차", "카카오", "랜덤ABC", "네이버", "LG화학"]
    scores = {run_pipeline(client.get_applicant_data(n))["portfolio_score"] for n in names}
    # At least 5 of 6 should be unique (no mass collisions onto one fallback score).
    assert len(scores) >= 5


def test_score_is_deterministic_through_pipeline():
    client = KiprisClient(mode="mock")
    s1 = run_pipeline(client.get_applicant_data("결정론테스트"))["portfolio_score"]
    s2 = run_pipeline(client.get_applicant_data("결정론테스트"))["portfolio_score"]
    assert s1 == s2


def test_curated_fixtures_bypass_synthesis():
    """A name present in FIXTURES must return its calibrated portfolio, not synthetic."""
    client = KiprisClient(mode="mock")
    demo = "삼정테크 (주)"
    assert demo in FIXTURES
    assert client.get_applicant_data(demo) is FIXTURES[demo]
