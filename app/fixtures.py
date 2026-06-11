"""
Mock fixtures for IPScope.

Six applicant profiles with 1–4 patents/trademarks each.
Demo applicant: "삼정테크 (주)" — designed to score ≈ 37.9 / 100 (LOW).

Calibration notes:
    - Each patent is scored by all applicable modules.
    - Patent portfolio aggregate uses concentration_adjust() + PATENT_MODULE_WEIGHTS.
    - Target demo portfolio score: 37.9 ± 1.0.
    - Two HIGH-risk applicants included for MED/HIGH traffic-light coverage.

VALIDATION_SET: ~30 labeled rows (patent record + ground truth invalidated bool)
    for retrospective AUC measurement. Pre-trial signals only — trial_history=None.
"""

from typing import Any

# ---------------------------------------------------------------------------
# Patent / trademark record type alias
# ---------------------------------------------------------------------------

PatentRecord = dict[str, Any]
TrademarkRecord = dict[str, Any]
ApplicantFixture = dict[str, Any]

# ---------------------------------------------------------------------------
# Demo applicant — "삼정테크 (주)" — target portfolio score ≈ 37.9 (LOW)
# ---------------------------------------------------------------------------
#
# Tuning log (patent-level invalidation scores should span 17–56):
#   P-001: dispute~44  invalidation~22  expiry~18   → weighted ≈ 28.3
#   P-002: dispute~51  invalidation~31  expiry~30   → weighted ≈ 37.6
#   P-003: dispute~46  invalidation~56  expiry~28   → weighted ≈ 43.7
#   P-004: dispute~38  invalidation~17  expiry~100  → weighted ≈ 39.4  (lapsed!)
# concentration_adjust over [28.3, 37.6, 43.7, 39.4] → target ≈ 37.9
# ---------------------------------------------------------------------------

DEMO_APPLICANT: ApplicantFixture = {
    "name": "삼정테크 (주)",
    "patents": [
        {
            "id": "KR10-2015-0087234",
            "title": "반도체 패키징 공정 개선 방법",
            # Calibrated: dispute≈59.6 inv≈7.1 exp≈1.5 → weighted_agg≈26.71
            "forward_citations_pct": 0.35,   # below-median: lower dispute risk
            "family_size": 2,
            "claim_count": 8,
            "applicant_type": "sme",
            # invalidation fields — clean prosecution, low-density IPC
            "prior_art_density": 0.25,
            "office_action_count": 1,
            "ipc_density": 0.22,
            "trial_history": None,           # no trial history (pre-trial)
            # expiry fields — 16 yrs remaining, early annuity → very low expiry risk
            "filing_date": "2010-06-01",
            "remaining_years": 16.0,
            "annuity_year": 5,
            "status": "active",
        },
        {
            "id": "KR10-2018-0034511",
            "title": "OLED 디스플레이 발광층 구조",
            # Calibrated: dispute≈76.2 inv≈11.5 exp≈4.4 → weighted_agg≈35.63
            "forward_citations_pct": 0.60,   # moderate-high citation band
            "family_size": 5,
            "claim_count": 15,
            "applicant_type": "corp",
            # invalidation — moderate prosecution, average-density IPC
            "prior_art_density": 0.42,
            "office_action_count": 2,
            "ipc_density": 0.36,
            "trial_history": None,
            # expiry — 14.5 yrs remaining, year-7 annuity → low expiry risk
            "filing_date": "2018-03-15",
            "remaining_years": 14.5,
            "annuity_year": 7,
            "status": "active",
        },
        {
            "id": "KR10-2020-0112988",
            "title": "배터리 열관리 시스템",
            # Calibrated: dispute≈81.9 inv≈22.4 exp≈2.8 → weighted_agg≈41.29
            # High-invalidation patent (invalidation score intentionally spans 17–56 range)
            "forward_citations_pct": 0.72,   # high citation band
            "family_size": 8,
            "claim_count": 22,
            "applicant_type": "corp",
            # invalidation — crowded IPC class, heavy prosecution history
            "prior_art_density": 0.68,
            "office_action_count": 4,
            "ipc_density": 0.63,
            "trial_history": None,
            # expiry — 15 yrs remaining, year-6 annuity → very low expiry risk
            "filing_date": "2020-09-20",
            "remaining_years": 15.0,
            "annuity_year": 6,
            "status": "active",
        },
        {
            "id": "KR10-2010-0045001",
            "title": "구형 냉각 모듈 (만료)",
            # Calibrated: dispute≈51.3 inv≈6.2 exp=100.0 (lapsed) → weighted_agg≈47.71
            "forward_citations_pct": 0.20,   # low citations — old, niche
            "family_size": 1,
            "claim_count": 5,
            "applicant_type": "corp",
            # invalidation — low-risk profile
            "prior_art_density": 0.20,
            "office_action_count": 1,
            "ipc_density": 0.20,
            "trial_history": None,
            # expiry — LAPSED → hard override to 100.0
            "filing_date": "2010-04-01",
            "remaining_years": 0.0,
            "annuity_year": 16,
            "status": "lapsed",
        },
    ],
    "trademarks": [
        {
            "id": "KR40-2019-0078123",
            "title": "삼정테크 로고",
            # Calibrated: trademark score ≈ 38.0 so combined portfolio ≈ 37.9
            # One historical KIPRIS refusal on record (later resolved) → mild risk
            "similar_group_codes": 3,
            "designated_goods": 15,
            "prior_registration_conflict": False,
            "refusal_history": True,
        },
    ],
}

# ---------------------------------------------------------------------------
# Additional applicants (LOW, MED, HIGH, HIGH, LOW)
# ---------------------------------------------------------------------------

FIXTURES: dict[str, ApplicantFixture] = {
    "삼정테크 (주)": DEMO_APPLICANT,

    # --- LOW risk: small university spinout, clean IP ---
    "한국대학교 기술지주": {
        "name": "한국대학교 기술지주",
        "patents": [
            {
                "id": "KR10-2021-0055001",
                "title": "친환경 수처리 촉매",
                "forward_citations_pct": 0.35,
                "family_size": 2,
                "claim_count": 6,
                "applicant_type": "univ",
                "prior_art_density": 0.20,
                "office_action_count": 1,
                "ipc_density": 0.15,
                "trial_history": None,
                "filing_date": "2021-04-10",
                "remaining_years": 15.0,
                "annuity_year": 5,
                "status": "active",
            },
        ],
        "trademarks": [],
    },

    # --- MED risk: mid-size corp, mixed portfolio ---
    "넥스테크 코리아": {
        "name": "넥스테크 코리아",
        "patents": [
            {
                "id": "KR10-2017-0091230",
                "title": "IoT 센서 네트워크 프로토콜",
                "forward_citations_pct": 0.65,
                "family_size": 5,
                "claim_count": 15,
                "applicant_type": "corp",
                "prior_art_density": 0.50,
                "office_action_count": 3,
                "ipc_density": 0.50,
                "trial_history": None,
                "filing_date": "2017-07-22",
                "remaining_years": 11.0,
                "annuity_year": 9,
                "status": "active",
            },
            {
                "id": "KR10-2019-0034888",
                "title": "AI 기반 이상 탐지 시스템",
                "forward_citations_pct": 0.72,
                "family_size": 7,
                "claim_count": 20,
                "applicant_type": "corp",
                "prior_art_density": 0.55,
                "office_action_count": 3,
                "ipc_density": 0.55,
                "trial_history": None,
                "filing_date": "2019-02-14",
                "remaining_years": 13.0,
                "annuity_year": 7,
                "status": "active",
            },
        ],
        "trademarks": [
            {
                "id": "KR40-2020-0044001",
                "title": "NEXTECH 브랜드",
                "similar_group_codes": 3,
                "designated_goods": 12,
                "prior_registration_conflict": False,
                "refusal_history": True,   # one refusal on record
            },
        ],
    },

    # --- HIGH risk: heavy litigant, contested patents, contested trademark ---
    "글로벌IP홀딩스": {
        "name": "글로벌IP홀딩스",
        "patents": [
            {
                "id": "KR10-2014-0071100",
                "title": "무선 충전 핵심 특허",
                "forward_citations_pct": 0.85,   # very high — NPE target
                "family_size": 15,
                "claim_count": 35,
                "applicant_type": "corp",
                "prior_art_density": 0.75,
                "office_action_count": 6,
                "ipc_density": 0.80,
                "trial_history": True,           # LOOKAHEAD RISK if pre-trial
                "filing_date": "2014-05-30",
                "remaining_years": 8.0,
                "annuity_year": 12,
                "status": "active",
            },
            {
                "id": "KR10-2016-0088200",
                "title": "디스플레이 구동 IC 특허",
                "forward_citations_pct": 0.80,
                "family_size": 12,
                "claim_count": 28,
                "applicant_type": "corp",
                "prior_art_density": 0.70,
                "office_action_count": 5,
                "ipc_density": 0.72,
                "trial_history": True,           # LOOKAHEAD RISK if pre-trial
                "filing_date": "2016-08-11",
                "remaining_years": 10.0,
                "annuity_year": 10,
                "status": "active",
            },
        ],
        "trademarks": [
            {
                "id": "KR40-2018-0021500",
                "title": "GlobalIP 상표",
                "similar_group_codes": 6,
                "designated_goods": 20,
                "prior_registration_conflict": True,
                "refusal_history": True,
            },
        ],
    },

    # --- HIGH risk: mostly lapsed + disputed ---
    "구형특허조합": {
        "name": "구형특허조합",
        "patents": [
            {
                "id": "KR10-2008-0012001",
                "title": "구형 통신 모듈",
                "forward_citations_pct": 0.40,
                "family_size": 2,
                "claim_count": 10,
                "applicant_type": "corp",
                "prior_art_density": 0.35,
                "office_action_count": 2,
                "ipc_density": 0.30,
                "trial_history": None,
                "filing_date": "2008-01-15",
                "remaining_years": 0.0,
                "annuity_year": 18,
                "status": "expired",
            },
            {
                "id": "KR10-2010-0099900",
                "title": "구형 메모리 인터페이스",
                "forward_citations_pct": 0.30,
                "family_size": 1,
                "claim_count": 7,
                "applicant_type": "corp",
                "prior_art_density": 0.30,
                "office_action_count": 2,
                "ipc_density": 0.25,
                "trial_history": None,
                "filing_date": "2010-10-01",
                "remaining_years": 0.0,
                "annuity_year": 16,
                "status": "lapsed",
            },
        ],
        "trademarks": [],
    },

    # --- LOW risk: individual inventor, single clean patent ---
    "박민준 (개인)": {
        "name": "박민준 (개인)",
        "patents": [
            {
                "id": "KR10-2023-0034100",
                "title": "스마트 농업 수분 센서",
                "forward_citations_pct": 0.25,
                "family_size": 1,
                "claim_count": 5,
                "applicant_type": "individual",
                "prior_art_density": 0.18,
                "office_action_count": 1,
                "ipc_density": 0.20,
                "trial_history": None,
                "filing_date": "2023-03-01",
                "remaining_years": 17.0,
                "annuity_year": 3,
                "status": "active",
            },
        ],
        "trademarks": [],
    },
}

# ---------------------------------------------------------------------------
# Validation set (~30 labeled rows) for retrospective AUC measurement
# Fields use PRE-TRIAL signals only (trial_history=None throughout)
# LOOKAHEAD RISK: do NOT include trial_history or post-grant citation counts
# ---------------------------------------------------------------------------

VALIDATION_SET: list[dict[str, Any]] = [
    # Invalidated patents (label=1) — high-risk signal profiles
    {"forward_citations_pct": 0.82, "family_size": 14, "claim_count": 32, "applicant_type": "corp",
     "prior_art_density": 0.78, "office_action_count": 6, "ipc_density": 0.75, "trial_history": None,
     "filing_date": "2013-01-01", "remaining_years": 7.0, "annuity_year": 13, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.78, "family_size": 11, "claim_count": 28, "applicant_type": "corp",
     "prior_art_density": 0.72, "office_action_count": 5, "ipc_density": 0.70, "trial_history": None,
     "filing_date": "2015-06-01", "remaining_years": 9.0, "annuity_year": 11, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.86, "family_size": 18, "claim_count": 40, "applicant_type": "corp",
     "prior_art_density": 0.82, "office_action_count": 7, "ipc_density": 0.80, "trial_history": None,
     "filing_date": "2012-03-15", "remaining_years": 6.0, "annuity_year": 14, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.73, "family_size": 9, "claim_count": 25, "applicant_type": "corp",
     "prior_art_density": 0.68, "office_action_count": 5, "ipc_density": 0.65, "trial_history": None,
     "filing_date": "2016-09-10", "remaining_years": 10.0, "annuity_year": 10, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.90, "family_size": 20, "claim_count": 38, "applicant_type": "corp",
     "prior_art_density": 0.85, "office_action_count": 8, "ipc_density": 0.85, "trial_history": None,
     "filing_date": "2011-05-20", "remaining_years": 5.0, "annuity_year": 15, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.76, "family_size": 10, "claim_count": 30, "applicant_type": "corp",
     "prior_art_density": 0.70, "office_action_count": 6, "ipc_density": 0.68, "trial_history": None,
     "filing_date": "2014-11-30", "remaining_years": 8.5, "annuity_year": 12, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.68, "family_size": 8, "claim_count": 22, "applicant_type": "corp",
     "prior_art_density": 0.62, "office_action_count": 4, "ipc_density": 0.60, "trial_history": None,
     "filing_date": "2017-02-14", "remaining_years": 11.0, "annuity_year": 9, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.81, "family_size": 13, "claim_count": 35, "applicant_type": "corp",
     "prior_art_density": 0.76, "office_action_count": 7, "ipc_density": 0.74, "trial_history": None,
     "filing_date": "2013-08-05", "remaining_years": 7.5, "annuity_year": 13, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.70, "family_size": 7, "claim_count": 20, "applicant_type": "corp",
     "prior_art_density": 0.65, "office_action_count": 5, "ipc_density": 0.63, "trial_history": None,
     "filing_date": "2016-04-20", "remaining_years": 10.5, "annuity_year": 10, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.84, "family_size": 16, "claim_count": 42, "applicant_type": "corp",
     "prior_art_density": 0.80, "office_action_count": 8, "ipc_density": 0.78, "trial_history": None,
     "filing_date": "2011-12-01", "remaining_years": 5.5, "annuity_year": 15, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.65, "family_size": 6, "claim_count": 18, "applicant_type": "corp",
     "prior_art_density": 0.60, "office_action_count": 4, "ipc_density": 0.58, "trial_history": None,
     "filing_date": "2018-07-11", "remaining_years": 12.0, "annuity_year": 8, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.79, "family_size": 12, "claim_count": 31, "applicant_type": "corp",
     "prior_art_density": 0.74, "office_action_count": 6, "ipc_density": 0.71, "trial_history": None,
     "filing_date": "2014-03-22", "remaining_years": 8.0, "annuity_year": 12, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.72, "family_size": 9, "claim_count": 26, "applicant_type": "corp",
     "prior_art_density": 0.66, "office_action_count": 5, "ipc_density": 0.62, "trial_history": None,
     "filing_date": "2016-10-15", "remaining_years": 10.5, "annuity_year": 10, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.88, "family_size": 19, "claim_count": 44, "applicant_type": "corp",
     "prior_art_density": 0.84, "office_action_count": 9, "ipc_density": 0.83, "trial_history": None,
     "filing_date": "2010-06-01", "remaining_years": 4.0, "annuity_year": 16, "status": "active",
     "invalidated": True},

    {"forward_citations_pct": 0.67, "family_size": 7, "claim_count": 21, "applicant_type": "corp",
     "prior_art_density": 0.61, "office_action_count": 4, "ipc_density": 0.59, "trial_history": None,
     "filing_date": "2018-01-09", "remaining_years": 12.0, "annuity_year": 8, "status": "active",
     "invalidated": True},

    # Upheld / not invalidated patents (label=0) — low-risk profiles
    {"forward_citations_pct": 0.30, "family_size": 2, "claim_count": 6, "applicant_type": "univ",
     "prior_art_density": 0.20, "office_action_count": 1, "ipc_density": 0.15, "trial_history": None,
     "filing_date": "2021-04-10", "remaining_years": 15.0, "annuity_year": 5, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.25, "family_size": 1, "claim_count": 5, "applicant_type": "individual",
     "prior_art_density": 0.18, "office_action_count": 1, "ipc_density": 0.12, "trial_history": None,
     "filing_date": "2022-08-20", "remaining_years": 16.0, "annuity_year": 4, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.40, "family_size": 3, "claim_count": 9, "applicant_type": "sme",
     "prior_art_density": 0.25, "office_action_count": 2, "ipc_density": 0.22, "trial_history": None,
     "filing_date": "2020-05-15", "remaining_years": 14.0, "annuity_year": 6, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.35, "family_size": 2, "claim_count": 7, "applicant_type": "univ",
     "prior_art_density": 0.22, "office_action_count": 1, "ipc_density": 0.18, "trial_history": None,
     "filing_date": "2021-09-30", "remaining_years": 15.5, "annuity_year": 5, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.20, "family_size": 1, "claim_count": 4, "applicant_type": "individual",
     "prior_art_density": 0.15, "office_action_count": 1, "ipc_density": 0.10, "trial_history": None,
     "filing_date": "2023-01-15", "remaining_years": 17.0, "annuity_year": 3, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.45, "family_size": 3, "claim_count": 10, "applicant_type": "sme",
     "prior_art_density": 0.28, "office_action_count": 2, "ipc_density": 0.25, "trial_history": None,
     "filing_date": "2020-11-11", "remaining_years": 14.5, "annuity_year": 6, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.38, "family_size": 2, "claim_count": 8, "applicant_type": "univ",
     "prior_art_density": 0.24, "office_action_count": 1, "ipc_density": 0.20, "trial_history": None,
     "filing_date": "2021-06-25", "remaining_years": 15.0, "annuity_year": 5, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.28, "family_size": 2, "claim_count": 6, "applicant_type": "individual",
     "prior_art_density": 0.19, "office_action_count": 1, "ipc_density": 0.14, "trial_history": None,
     "filing_date": "2022-03-10", "remaining_years": 16.0, "annuity_year": 4, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.50, "family_size": 4, "claim_count": 11, "applicant_type": "sme",
     "prior_art_density": 0.32, "office_action_count": 2, "ipc_density": 0.28, "trial_history": None,
     "filing_date": "2020-07-07", "remaining_years": 14.0, "annuity_year": 6, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.33, "family_size": 2, "claim_count": 7, "applicant_type": "univ",
     "prior_art_density": 0.21, "office_action_count": 1, "ipc_density": 0.17, "trial_history": None,
     "filing_date": "2021-12-20", "remaining_years": 15.0, "annuity_year": 5, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.42, "family_size": 3, "claim_count": 9, "applicant_type": "sme",
     "prior_art_density": 0.26, "office_action_count": 2, "ipc_density": 0.23, "trial_history": None,
     "filing_date": "2020-09-15", "remaining_years": 14.5, "annuity_year": 6, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.22, "family_size": 1, "claim_count": 5, "applicant_type": "individual",
     "prior_art_density": 0.16, "office_action_count": 1, "ipc_density": 0.11, "trial_history": None,
     "filing_date": "2023-06-01", "remaining_years": 17.0, "annuity_year": 3, "status": "active",
     "invalidated": False},

    {"forward_citations_pct": 0.47, "family_size": 3, "claim_count": 10, "applicant_type": "sme",
     "prior_art_density": 0.29, "office_action_count": 2, "ipc_density": 0.26, "trial_history": None,
     "filing_date": "2021-02-18", "remaining_years": 15.0, "annuity_year": 5, "status": "active",
     "invalidated": False},
]
