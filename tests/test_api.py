"""
Tests for app/main.py — FastAPI endpoints.

Uses httpx TestClient (starlette dependency, bundled with fastapi).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

_client = TestClient(app)


class TestHealthEndpoint:
    def test_health_200(self) -> None:
        response = _client.get("/health")
        assert response.status_code == 200

    def test_health_payload(self) -> None:
        response = _client.get("/health")
        assert response.json() == {"status": "ok"}


class TestInfoEndpoint:
    def test_info_200(self) -> None:
        response = _client.get("/info")
        assert response.status_code == 200

    def test_info_has_name(self) -> None:
        data = _client.get("/info").json()
        assert data["name"] == "IPScope"

    def test_info_has_modules(self) -> None:
        data = _client.get("/info").json()
        assert len(data["modules"]) >= 3

    def test_info_has_weights(self) -> None:
        data = _client.get("/info").json()
        assert "weights" in data
        assert len(data["weights"]) == 3

    def test_info_has_data_source(self) -> None:
        data = _client.get("/info").json()
        assert "data_source" in data
        assert "mock" in data["data_source"].lower() or "live" in data["data_source"].lower()


class TestIndexEndpoint:
    def test_root_200(self) -> None:
        response = _client.get("/")
        assert response.status_code == 200

    def test_root_returns_html(self) -> None:
        response = _client.get("/")
        assert "text/html" in response.headers["content-type"]

    def test_root_contains_form(self) -> None:
        response = _client.get("/")
        assert b"<form" in response.content


class TestAnalyzeEndpoint:
    def test_analyze_demo_applicant_200(self) -> None:
        response = _client.post("/analyze", data={"applicant_name": "삼정테크 (주)"})
        assert response.status_code == 200

    def test_analyze_returns_html(self) -> None:
        response = _client.post("/analyze", data={"applicant_name": "삼정테크 (주)"})
        assert "text/html" in response.headers["content-type"]

    def test_analyze_contains_score(self) -> None:
        response = _client.post("/analyze", data={"applicant_name": "삼정테크 (주)"})
        # Score string should appear in report
        content = response.text
        assert "37" in content or "38" in content or "39" in content  # ≈37.9

    def test_analyze_contains_grade(self) -> None:
        response = _client.post("/analyze", data={"applicant_name": "삼정테크 (주)"})
        content = response.text
        assert "LOW" in content or "MED" in content or "HIGH" in content

    def test_analyze_contains_basis_strings(self) -> None:
        response = _client.post("/analyze", data={"applicant_name": "삼정테크 (주)"})
        content = response.text
        assert "Lanjouw" in content or "Harhoff" in content or "IP5" in content

    def test_analyze_empty_name_400(self) -> None:
        response = _client.post("/analyze", data={"applicant_name": "  "})
        assert response.status_code == 400

    def test_analyze_json_endpoint(self) -> None:
        response = _client.get("/analyze/json", params={"applicant_name": "삼정테크 (주)"})
        assert response.status_code == 200
        data = response.json()
        assert "portfolio_score" in data
        assert "grade" in data

    def test_analyze_high_risk_applicant(self) -> None:
        response = _client.get(
            "/analyze/json", params={"applicant_name": "글로벌IP홀딩스"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["grade"] == "HIGH", (
            f"글로벌IP홀딩스 should be HIGH risk, got {data['grade']}"
        )

    def test_analyze_weight_disclosure_in_html(self) -> None:
        """Report must show weight breakdown (no black box requirement)."""
        response = _client.post("/analyze", data={"applicant_name": "삼정테크 (주)"})
        content = response.text
        # Weights should appear as percentages
        assert "40%" in content or "35%" in content or "25%" in content


class TestValidationHarness:
    """
    Smoke test: validation harness must produce a finite AUC in [0.5, 1.0].
    Proper AUC test (exact value) is in test_validate_retrospective.py.
    """

    def test_auc_is_finite_and_above_chance(self) -> None:
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent.parent))

        from validate_retrospective import compute_auc
        from app.fixtures import VALIDATION_SET
        from app.modules import invalidation_module

        labels = [int(r["invalidated"]) for r in VALIDATION_SET]
        scores = [
            invalidation_module({k: v for k, v in r.items() if k != "invalidated"})["score"]
            for r in VALIDATION_SET
        ]

        auc = compute_auc(labels, scores)
        assert 0.0 <= auc <= 1.0
        assert auc > 0.5, f"AUC {auc:.4f} is at or below chance — model has no signal"
