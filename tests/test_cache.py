"""
Tests for app/cache.py — SQLite cache hit/miss/TTL/eviction.
"""

import time
from pathlib import Path

import pytest

from app.cache import AnalysisCache

_SAMPLE_RESULT: dict = {
    "applicant": "테스트 주식회사",
    "portfolio_score": 42.5,
    "grade": "MED",
}


@pytest.fixture
def tmp_cache(tmp_path: Path) -> AnalysisCache:
    """Create a fresh AnalysisCache backed by a temp file."""
    db = tmp_path / "test_cache.db"
    return AnalysisCache(db_path=db, ttl_seconds=60)


class TestCacheMiss:
    def test_miss_on_empty_cache(self, tmp_cache: AnalysisCache) -> None:
        result = tmp_cache.get("없는 출원인")
        assert result is None

    def test_miss_after_invalidation(self, tmp_cache: AnalysisCache) -> None:
        tmp_cache.set("회사A", _SAMPLE_RESULT)
        tmp_cache.invalidate("회사A")
        assert tmp_cache.get("회사A") is None


class TestCacheHit:
    def test_hit_after_set(self, tmp_cache: AnalysisCache) -> None:
        tmp_cache.set("회사B", _SAMPLE_RESULT)
        cached = tmp_cache.get("회사B")
        assert cached is not None
        assert cached["portfolio_score"] == 42.5

    def test_hit_case_insensitive_key(self, tmp_cache: AnalysisCache) -> None:
        tmp_cache.set("COMPANY C", _SAMPLE_RESULT)
        # Keys are normalized to lowercase
        assert tmp_cache.get("company c") is not None
        assert tmp_cache.get("COMPANY C") is not None

    def test_upsert_overwrites(self, tmp_cache: AnalysisCache) -> None:
        tmp_cache.set("회사D", _SAMPLE_RESULT)
        updated = {**_SAMPLE_RESULT, "portfolio_score": 99.0}
        tmp_cache.set("회사D", updated)
        cached = tmp_cache.get("회사D")
        assert cached is not None
        assert cached["portfolio_score"] == 99.0


class TestCacheTTL:
    def test_expired_returns_none(self, tmp_path: Path) -> None:
        """Use TTL=0 to force immediate expiry."""
        db = tmp_path / "ttl_test.db"
        cache = AnalysisCache(db_path=db, ttl_seconds=0)
        cache.set("회사E", _SAMPLE_RESULT)
        # TTL=0 → any entry is immediately expired
        result = cache.get("회사E")
        assert result is None

    def test_evict_expired_removes_stale(self, tmp_path: Path) -> None:
        db = tmp_path / "evict_test.db"
        cache = AnalysisCache(db_path=db, ttl_seconds=0)
        cache.set("회사F", _SAMPLE_RESULT)
        deleted = cache.evict_expired()
        assert deleted >= 1


class TestCachePersistence:
    def test_survives_reopen(self, tmp_path: Path) -> None:
        db = tmp_path / "persist.db"
        c1 = AnalysisCache(db_path=db, ttl_seconds=3600)
        c1.set("회사G", _SAMPLE_RESULT)

        c2 = AnalysisCache(db_path=db, ttl_seconds=3600)
        cached = c2.get("회사G")
        assert cached is not None
        assert cached["grade"] == "MED"
