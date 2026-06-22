"""
KIPRIS API client with mock/live mode switch.

Mode selection:
  - If env var KIPRIS_SERVICE_KEY is set and non-empty → LIVE mode (structured stub).
  - Otherwise → MOCK mode (reads from fixtures).

Live mode builds the correct KIPRIS Open API URL and parses XML responses.
It is NOT called in tests; the test suite always runs in MOCK mode.

KIPRIS Open API base: https://plus.kipris.or.kr/kipo-api/kipi/
"""

import logging
import os
import xml.etree.ElementTree as ET
from typing import Any

try:
    import urllib.request as _urllib_request
    import urllib.parse as _urllib_parse
    _URLLIB_AVAILABLE = True
except ImportError:
    _URLLIB_AVAILABLE = False

from app.fixtures import FIXTURES, ApplicantFixture
from app.synthetic import synthesize_applicant

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Base URL is overridable via env (KIPRIS_BASE_URL). If the default HTTPS host
# errors at request time, the client also retries once over HTTP automatically
# (KIPRIS Plus endpoints are commonly documented over plain HTTP).
KIPRIS_BASE_URL: str = os.environ.get(
    "KIPRIS_BASE_URL", "https://plus.kipris.or.kr/kipo-api/kipi/"
)
KIPRIS_PATENT_SEARCH_PATH: str = "patUtiModInfoSearchSevice/applicantNameSearchInfo"
KIPRIS_TM_SEARCH_PATH: str = "trademarkInfoSearchService/applicantNameSearchInfo"
ENV_KEY_NAME: str = "KIPRIS_SERVICE_KEY"

DEFAULT_MOCK_APPLICANT: str = "삼정테크 (주)"


# ---------------------------------------------------------------------------
# Live client helpers (structural stubs — wired but not called in tests)
# ---------------------------------------------------------------------------

def _build_kipris_url(path: str, params: dict[str, str]) -> str:
    """Construct a KIPRIS Open API URL with query parameters."""
    query = _urllib_parse.urlencode(params)
    return f"{KIPRIS_BASE_URL}{path}?{query}"


def _urlopen_with_fallback(url: str, timeout: int = 10):
    """Open ``url``, retrying once over HTTP if the HTTPS request fails.

    KIPRIS Plus endpoints are commonly served/documented over plain HTTP. If the
    default HTTPS base URL raises (SSL error, redirect loop, connection refused),
    fall back to HTTP once — so a deploy with a valid key never fails purely on
    the URL scheme. ``URLError``/``SSLError`` are both subclasses of ``OSError``.
    """
    try:
        return _urllib_request.urlopen(url, timeout=timeout)  # noqa: S310
    except OSError as exc:
        if url.startswith("https://"):
            http_url = "http://" + url[len("https://"):]
            logger.warning("KIPRIS HTTPS fetch failed (%s); retrying over HTTP", exc)
            return _urllib_request.urlopen(http_url, timeout=timeout)  # noqa: S310
        raise


def _parse_patent_xml(xml_bytes: bytes) -> list[dict[str, Any]]:
    """
    Parse KIPRIS patent search XML response into a list of patent dicts.

    Expected XML structure (abbreviated):
        <response>
          <body>
            <items>
              <PatentUtilityInfo>
                <applicationNumber>...</applicationNumber>
                <inventionName>...</inventionName>
                <applicantName>...</applicantName>
                <registerStatus>...</registerStatus>
                <applyDate>...</applyDate>
              </PatentUtilityInfo>
            </items>
          </body>
        </response>

    Returns parsed list; empty list on parse errors.
    """
    records: list[dict[str, Any]] = []
    try:
        root = ET.fromstring(xml_bytes)
        items = root.find(".//items")
        if items is None:
            return records
        for item in items:
            record: dict[str, Any] = {}
            for child in item:
                record[child.tag] = child.text
            records.append(record)
    except ET.ParseError as exc:
        logger.error("KIPRIS XML parse error: %s", exc)
    return records


def _fetch_live_patents(applicant_name: str, service_key: str) -> list[dict[str, Any]]:
    """
    Fetch patent records from KIPRIS live API.

    This function is NOT called in tests (mock mode intercepts earlier).
    """
    params = {
        "applicant": applicant_name,
        "ServiceKey": service_key,
        "numOfRows": "10",
        "pageNo": "1",
    }
    url = _build_kipris_url(KIPRIS_PATENT_SEARCH_PATH, params)
    logger.info("KIPRIS live fetch: %s", url)

    with _urlopen_with_fallback(url, timeout=10) as resp:
        raw = resp.read()

    raw_records = _parse_patent_xml(raw)
    logger.info("KIPRIS returned %d patent records for '%s'", len(raw_records), applicant_name)
    return raw_records


def _fetch_live_trademarks(applicant_name: str, service_key: str) -> list[dict[str, Any]]:
    """
    Fetch trademark records from KIPRIS live API.

    NOT called in tests.
    """
    params = {
        "applicant": applicant_name,
        "ServiceKey": service_key,
        "numOfRows": "10",
        "pageNo": "1",
    }
    url = _build_kipris_url(KIPRIS_TM_SEARCH_PATH, params)
    logger.info("KIPRIS TM live fetch: %s", url)

    with _urlopen_with_fallback(url, timeout=10) as resp:
        raw = resp.read()

    raw_records = _parse_patent_xml(raw)
    logger.info("KIPRIS returned %d TM records for '%s'", len(raw_records), applicant_name)
    return raw_records


# ---------------------------------------------------------------------------
# KiprisClient
# ---------------------------------------------------------------------------

class KiprisClient:
    """
    KIPRIS data client.  Wraps mock fixtures and live API under a single
    interface so the pipeline layer never needs to know the data source.

    Args:
        mode: 'mock' | 'live'. Auto-detected from env if not supplied.
    """

    def __init__(self, mode: str = "auto") -> None:
        if mode == "auto":
            service_key = os.environ.get(ENV_KEY_NAME, "").strip()
            self.mode: str = "live" if service_key else "mock"
            self._service_key: str = service_key
        elif mode == "live":
            service_key = os.environ.get(ENV_KEY_NAME, "").strip()
            if not service_key:
                raise ValueError(
                    f"mode='live' requires env var {ENV_KEY_NAME} to be set"
                )
            self.mode = "live"
            self._service_key = service_key
        elif mode == "mock":
            self.mode = "mock"
            self._service_key = ""
        else:
            raise ValueError(f"mode must be 'mock', 'live', or 'auto'; got '{mode}'")

        logger.info("KiprisClient initialized in %s mode", self.mode)

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def get_applicant_data(self, applicant_name: str) -> ApplicantFixture:
        """
        Retrieve all patents and trademarks for an applicant.

        In mock mode: looks up the name in FIXTURES, falling back to the
        default demo applicant if not found (so any name returns valid data).

        In live mode: calls KIPRIS API and returns normalized records.
        Note — live records will be sparse (raw KIPRIS fields only).
        The scoring pipeline will impute missing fields conservatively.

        Args:
            applicant_name: Korean or romanized applicant name.

        Returns:
            ApplicantFixture dict with 'name', 'patents', 'trademarks'.
        """
        if self.mode == "mock":
            return self._get_mock(applicant_name)
        return self._get_live(applicant_name)

    # ------------------------------------------------------------------
    # Mock implementation
    # ------------------------------------------------------------------

    def _get_mock(self, applicant_name: str) -> ApplicantFixture:
        """Return curated fixture data when available, else a deterministic
        synthetic portfolio derived from the name.

        Previously, an unknown name relabelled the demo applicant's portfolio,
        so every unknown company produced the identical score. Now unknown names
        get a stable, name-seeded synthetic portfolio (still MOCK data, no live
        call) so distinct inputs produce distinct scores.
        """
        if applicant_name in FIXTURES:
            logger.debug("Mock hit for applicant '%s'", applicant_name)
            return FIXTURES[applicant_name]

        logger.info(
            "Applicant '%s' not in fixtures — generating synthetic mock portfolio",
            applicant_name,
        )
        return synthesize_applicant(applicant_name)

    # ------------------------------------------------------------------
    # Live implementation (structural — calls real KIPRIS)
    # ------------------------------------------------------------------

    def _get_live(self, applicant_name: str) -> ApplicantFixture:
        """
        Fetch from live KIPRIS API and normalize into ApplicantFixture.

        Raw KIPRIS records are sparse — most scoring fields will be absent
        and the modules will impute conservatively.
        """
        raw_patents = _fetch_live_patents(applicant_name, self._service_key)
        raw_trademarks = _fetch_live_trademarks(applicant_name, self._service_key)

        patents = [self._normalize_patent(r) for r in raw_patents]
        trademarks = [self._normalize_trademark(r) for r in raw_trademarks]

        return {
            "name": applicant_name,
            "patents": patents,
            "trademarks": trademarks,
        }

    @staticmethod
    def _normalize_patent(raw: dict[str, Any]) -> dict[str, Any]:
        """
        Map raw KIPRIS patent fields to AlphaNexus internal schema.

        Fields not available from KIPRIS are set to None; modules impute.
        """
        return {
            "id": raw.get("applicationNumber"),
            "title": raw.get("inventionName"),
            "forward_citations_pct": None,       # requires post-processing
            "family_size": None,                 # requires family API call
            "claim_count": None,                 # requires full-text API call
            "applicant_type": None,              # inferred from applicant name
            "prior_art_density": None,           # IPC-level derived metric
            "office_action_count": None,         # prosecution history API
            "ipc_density": None,                 # IPC subclass stats
            "trial_history": None,               # trial history API
            "filing_date": raw.get("applyDate"),
            "remaining_years": None,
            "annuity_year": None,
            "status": raw.get("registerStatus", "active").lower(),
        }

    @staticmethod
    def _normalize_trademark(raw: dict[str, Any]) -> dict[str, Any]:
        """Map raw KIPRIS trademark fields to AlphaNexus internal schema."""
        return {
            "id": raw.get("applicationNumber"),
            "title": raw.get("titleName"),
            "similar_group_codes": None,
            "designated_goods": None,
            "prior_registration_conflict": None,
            "refusal_history": None,
        }
