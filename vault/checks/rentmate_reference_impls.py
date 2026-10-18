"""Harness fixtures for the RentMate CPs — NOT product code.

These are throwaway reference implementations used only to prove the CP oracles
in `vault/cps/` are executable and satisfiable. The product is TypeScript
(`Figma/src/lib/matching.ts`); nothing here ships. Two formulations per CP, so
`g1_harness` can report agreement between them.

Both formulations were written from the CP contract, not from each other. The
2026-10-18 v2 rewrites were made against a now-existing implementation, so the
oracles are ALSO cross-checked against the shipped TypeScript by
`vault/checks/matching_ts_check.ts` (25/25). The S-9 correlated-failure risk
still stands: one author writing two versions from one contract is exactly what
the S-9 record exists to flag, and no independence record is written here.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

# --------------------------------------------------------------------------
# CP.filter_eligible_matches.v2   (five families, both directions)
# --------------------------------------------------------------------------

# The commute ESTIMATE model the CP pins as a contract parameter: 10 min
# boarding + 2.4 min/km, haversine over district centroids. The table is
# COPIED from Figma/src/lib/matching.ts (DISTRICT_COORDS) so the fixture
# estimates the same minutes as the product — an estimate that disagreed with
# the product would make the location oracle cases untestable here.
_DISTRICT_COORDS: Dict[str, Tuple[float, float]] = {
    "Sha Tin": (22.382, 114.188),
    "Tai Wai": (22.373, 114.179),
    "Ma On Shan": (22.4247, 114.231),
    "Fo Tan": (22.395, 114.192),
    "Kowloon Tong": (22.337, 114.176),
    "Ho Man Tin": (22.3095, 114.1825),
    "Hung Hom": (22.305, 114.182),
    "Mong Kok": (22.319, 114.169),
    "Yau Ma Tei": (22.3126, 114.1703),
    "Sham Shui Po": (22.3302, 114.1622),
    "Sai Ying Pun": (22.286, 114.142),
    "Kennedy Town": (22.282, 114.128),
    "Wan Chai": (22.2775, 114.1731),
    "North Point": (22.291, 114.2003),
    "Tai Po": (22.45, 114.168),
    "Tseung Kwan O": (22.308, 114.26),
    "Tuen Mun": (22.391, 113.977),
}


def _haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    R = 6371
    d_lat = math.radians(b[0] - a[0])
    d_lng = math.radians(b[1] - a[1])
    lat1, lat2 = math.radians(a[0]), math.radians(b[0])
    h = (math.sin(d_lat / 2) ** 2
         + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(h))


def _commute_minutes(from_district: str, to_district: str) -> Optional[int]:
    a, b = _DISTRICT_COORDS.get(from_district), _DISTRICT_COORDS.get(to_district)
    if a is None or b is None:
        return None
    return round(10 + _haversine_km(a, b) * 2.4)


# --- formulation A: one explicit helper per family --------------------------

def _gender_ok(seeker: Dict[str, Any], other: Dict[str, Any]) -> bool:
    lf = seeker.get("looking_for") or {}
    if lf.get("any_gender") is True:
        return True
    cats = lf.get("roommate_gender_categories")
    if not cats:
        return True                      # not stated -> no constraint
    ident = other.get("gender_identity")
    if ident is None or ident == "prefer_not_to_say":
        return False                     # undisclosed never passes a stated category
    return ident in cats


def _belief_ok(seeker: Dict[str, Any], other: Dict[str, Any]) -> bool:
    lf = seeker.get("looking_for") or {}
    if lf.get("any_belief") is True:
        return True
    wanted = lf.get("belief_systems")
    if not wanted:
        return True                      # not stated -> no constraint
    theirs = other.get("belief_system")
    if theirs and theirs in wanted:
        return True
    return False                         # mismatched OR undisclosed both fail


def _smoking_ok(seeker: Dict[str, Any], other: Dict[str, Any]) -> bool:
    lf = seeker.get("looking_for") or {}
    if lf.get("smoking_rule") != "required_non_smoking":
        return True
    return (other.get("about_me") or {}).get("smoking_status") == 1


def _location_ok(seeker: Dict[str, Any], other: Dict[str, Any]) -> bool:
    lf = seeker.get("looking_for") or {}
    limit = lf.get("max_commute_minutes")
    if limit is None:
        return True                      # no stated limit
    campus, area = seeker.get("campus_district"), other.get("area")
    if not campus or not area:
        return True                      # unknown -> never silently exclude
    minutes = _commute_minutes(area, campus)
    if minutes is None:
        return True                      # undefined estimate -> cannot fire
    return minutes <= limit


def _budget_ok(seeker: Dict[str, Any], other: Dict[str, Any]) -> bool:
    lf = seeker.get("looking_for") or {}
    cap = lf.get("budget_max")
    if cap is None:
        return True                      # no stated ceiling
    floor = other.get("budget_min")
    if floor is None:
        floor = other.get("budget_max")  # budget_max stands in as the floor
    if floor is None:
        return True                      # other side silent -> cannot fire
    return floor <= cap


def filter_eligible_matches_a(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> bool:
    checks = (_gender_ok, _belief_ok, _smoking_ok, _location_ok, _budget_ok)
    return all(
        check(seeker, other)
        for check in checks
        for seeker, other in ((profile_a, profile_b), (profile_b, profile_a))
    )


# --- formulation B: a constraint-collection loop ----------------------------

def filter_eligible_matches_b(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> bool:
    def constraints(p: Dict[str, Any]):
        lf = p.get("looking_for") or {}
        out: List[Tuple[str, Any]] = []
        if lf.get("any_gender") is not True and lf.get("roommate_gender_categories"):
            out.append(("gender", set(lf["roommate_gender_categories"])))
        if lf.get("any_belief") is not True and lf.get("belief_systems"):
            out.append(("belief", set(lf["belief_systems"])))
        if lf.get("smoking_rule") == "required_non_smoking":
            out.append(("nonsmoker", 1))
        if lf.get("max_commute_minutes") is not None:
            out.append(("commute", (lf["max_commute_minutes"], p.get("campus_district"))))
        if lf.get("budget_max") is not None:
            out.append(("budget", lf["budget_max"]))
        return out

    for seeker, other in ((profile_a, profile_b), (profile_b, profile_a)):
        for kind, arg in constraints(seeker):
            if kind == "gender":
                ident = other.get("gender_identity") or "prefer_not_to_say"
                if ident not in arg:
                    return False
            elif kind == "belief":
                theirs = other.get("belief_system")
                if theirs is None or theirs not in arg:
                    return False
            elif kind == "nonsmoker":
                if (other.get("about_me") or {}).get("smoking_status") != 1:
                    return False
            elif kind == "commute":
                limit, campus = arg
                area = other.get("area")
                if not campus or not area:
                    continue
                minutes = _commute_minutes(area, campus)
                if minutes is not None and minutes > limit:
                    return False
            elif kind == "budget":
                floor = other.get("budget_min")
                if floor is None:
                    floor = other.get("budget_max")
                if floor is not None and floor > arg:
                    return False
    return True


# --------------------------------------------------------------------------
# CP.calculate_match.v2   (MBTI is a scored factor; gender is NOT scored)
# --------------------------------------------------------------------------

SOFT_FACTORS = (
    "sleep_schedule", "shared_space_habits", "social_guest_preference",
    "noise_preference", "personal_space_preference", "bill_splitting_style",
)

# The four MBTI axis pairs, in position order (E/I, S/N, T/F, J/P).
_AXES = ("IE", "SN", "TF", "JP")


def _wellformed_mbti(t: Any) -> bool:
    return (isinstance(t, str) and len(t) == 4
            and all(t[i].upper() in _AXES[i] for i in range(4)))


def calculate_match_a(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> Dict[str, Any]:
    am, bm = profile_a.get("about_me") or {}, profile_b.get("about_me") or {}
    vals = [1 - abs(am[f] - bm[f]) for f in SOFT_FACTORS if f in am and f in bm]
    ta, tb = profile_a.get("mbti_type"), profile_b.get("mbti_type")
    if _wellformed_mbti(ta) and _wellformed_mbti(tb):
        differing = sum(1 for i in range(4) if ta[i] != tb[i])
        vals.append(1 - differing / 4)
    if not vals:
        return {"score": None, "status": "insufficient_data"}
    return {"score": round(100 * sum(vals) / len(vals)), "status": "scored"}


def calculate_match_b(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> Dict[str, Any]:
    am, bm = profile_a.get("about_me") or {}, profile_b.get("about_me") or {}
    common = sorted(set(SOFT_FACTORS) & set(am) & set(bm))
    sims = [1 - abs(am[f] - bm[f]) for f in common]
    ta, tb = profile_a.get("mbti_type"), profile_b.get("mbti_type")
    if _wellformed_mbti(ta) and _wellformed_mbti(tb):
        sims.append(1 - sum(1 for i in range(4) if ta[i] != tb[i]) / 4)
    if not sims:
        return {"score": None, "status": "insufficient_data"}
    return {"score": int(round(100 * sum(sims) / len(sims))), "status": "scored"}


# --------------------------------------------------------------------------
# CP.validate_institution_email.v2
# --------------------------------------------------------------------------

# Illustrative two-entry allowlist, matching the CP's oracle note. The shipped
# list is 12 institutions / 41 domains (Figma/src/lib/institutions.ts) and is
# CONFIGURATION, not contract — the CP pins only the matching semantics.
ALLOWLIST = {"cuhk.edu.hk": "CUHK", "hku.hk": "HKU"}


def validate_institution_email_a(email: str) -> Dict[str, Any]:
    if not isinstance(email, str) or email.count("@") != 1:
        return {"eligible": False, "institution": None}
    local, _, domain = email.partition("@")
    domain = domain.strip().lower()
    if not local or "." not in domain or domain.startswith(".") or domain.endswith("."):
        return {"eligible": False, "institution": None}
    inst = ALLOWLIST.get(domain)          # exact match only
    if inst is None:
        return {"eligible": False, "institution": None}
    return {"eligible": True, "institution": inst}


def validate_institution_email_b(email: str) -> Dict[str, Any]:
    if not isinstance(email, str) or "@" not in email:
        return {"eligible": False, "institution": None}
    local, _, domain = email.strip().partition("@")
    domain = domain.strip().lower()
    for d, inst in ALLOWLIST.items():
        if domain == d:                   # exact, dot-boundary by construction
            return {"eligible": True, "institution": inst}
    return {"eligible": False, "institution": None}
