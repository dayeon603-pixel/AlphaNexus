"""
SQLite-backed analysis cache for AlphaNexus.

Cache key: applicant name (lowercased, stripped).
TTL: 7 days.
Cache stores: the full JSON-serialized analysis result dict.
Repeated calls for the same applicant name within TTL → 0 API calls.
"""

import json
import logging
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CACHE_TTL_SECONDS: int = 7 * 24 * 60 * 60   # 7 days
DEFAULT_DB_PATH: Path = Path("/tmp/ipscope_cache.db")

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_CREATE_TABLE_SQL: str = """
CREATE TABLE IF NOT EXISTS analysis_cache (
    cache_key   TEXT PRIMARY KEY,
    result_json TEXT NOT NULL,
    cached_at   REAL NOT NULL
);
"""

_UPSERT_SQL: str = """
INSERT INTO analysis_cache (cache_key, result_json, cached_at)
VALUES (?, ?, ?)
ON CONFLICT(cache_key) DO UPDATE SET
    result_json = excluded.result_json,
    cached_at   = excluded.cached_at;
"""

_SELECT_SQL: str = """
SELECT result_json, cached_at FROM analysis_cache WHERE cache_key = ?;
"""

_DELETE_EXPIRED_SQL: str = """
DELETE FROM analysis_cache WHERE cached_at < ?;
"""


# ---------------------------------------------------------------------------
# AnalysisCache
# ---------------------------------------------------------------------------

class AnalysisCache:
    """
    Thread-safe (single-process) SQLite cache for analysis results.

    Args:
        db_path: Path to SQLite database file. Created if absent.
        ttl_seconds: Cache time-to-live in seconds. Default 7 days.
    """

    def __init__(
        self,
        db_path: Path = DEFAULT_DB_PATH,
        ttl_seconds: int = CACHE_TTL_SECONDS,
    ) -> None:
        self._db_path = db_path
        self._ttl = ttl_seconds
        self._init_db()

    def _init_db(self) -> None:
        """Create the cache table if it does not exist."""
        with self._connect() as conn:
            conn.execute(_CREATE_TABLE_SQL)
        logger.debug("Cache DB initialized at %s", self._db_path)

    def _connect(self) -> sqlite3.Connection:
        """Open a connection with WAL mode for concurrent read safety."""
        conn = sqlite3.connect(str(self._db_path))
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    @staticmethod
    def _normalize_key(applicant_name: str) -> str:
        """Normalize cache key: lowercase, stripped."""
        return applicant_name.strip().lower()

    def get(self, applicant_name: str) -> Optional[dict[str, Any]]:
        """
        Retrieve a cached analysis result.

        Args:
            applicant_name: Applicant name to look up.

        Returns:
            Deserialized result dict, or None if not cached / expired.
        """
        key = self._normalize_key(applicant_name)
        with self._connect() as conn:
            row = conn.execute(_SELECT_SQL, (key,)).fetchone()

        if row is None:
            logger.debug("Cache miss: '%s'", key)
            return None

        result_json, cached_at = row
        age = time.time() - cached_at

        if age > self._ttl:
            logger.debug("Cache expired for '%s' (age=%.0fs)", key, age)
            return None

        logger.info("Cache hit for '%s' (age=%.0fs)", key, age)
        return json.loads(result_json)  # type: ignore[no-any-return]

    def set(self, applicant_name: str, result: dict[str, Any]) -> None:
        """
        Store an analysis result in the cache.

        Args:
            applicant_name: Applicant name (cache key).
            result: Analysis result dict to cache.
        """
        key = self._normalize_key(applicant_name)
        now = time.time()
        payload = json.dumps(result, ensure_ascii=False)

        with self._connect() as conn:
            conn.execute(_UPSERT_SQL, (key, payload, now))

        logger.info("Cached result for '%s'", key)

    def evict_expired(self) -> int:
        """
        Delete all expired cache entries.

        Returns:
            Number of rows deleted.
        """
        cutoff = time.time() - self._ttl
        with self._connect() as conn:
            cursor = conn.execute(_DELETE_EXPIRED_SQL, (cutoff,))
            deleted = cursor.rowcount

        if deleted:
            logger.info("Evicted %d expired cache entries", deleted)
        return deleted

    def invalidate(self, applicant_name: str) -> None:
        """
        Force-remove a specific applicant from the cache.

        Args:
            applicant_name: Applicant name to invalidate.
        """
        key = self._normalize_key(applicant_name)
        with self._connect() as conn:
            conn.execute("DELETE FROM analysis_cache WHERE cache_key = ?;", (key,))
        logger.info("Invalidated cache for '%s'", key)
