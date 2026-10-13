"""Harness fixtures for the RentMate CPs — NOT product code.

These are throwaway reference implementations used only to prove the CP oracles
in `vault/cps/` are executable and satisfiable. The product is TypeScript
(`src/`, `Figma/`); nothing here ships. Two formulations per CP, so `g1_harness`
can report agreement between them.

Both formulations were written from the CP contract, not from each other, and
neither was read from a target (no target exists). That is why no S-9
independence record is written for the runs: one author writing two versions from
one contract is exactly the correlated-failure risk the record exists to flag.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

# --------------------------------------------------------------------------
# CP.filter_eligible_matches.v1
# --------------------------------------------------------------------------

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


def _smoking_ok(seeker: Dict[str, Any], other: Dict[str, Any]) -> bool:
    if (seeker.get("looking_for") or {}).get("smoking_rule") != "required_non_smoking":
        return True
    return (other.get("about_me") or {}).get("smoking_status") == "non_smoker"


def filter_eligible_matches_a(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> bool:
    return (_gender_ok(profile_a, profile_b) and _gender_ok(profile_b, profile_a)
            and _smoking_ok(profile_a, profile_b) and _smoking_ok(profile_b, profile_a))


def filter_eligible_matches_b(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> bool:
    def constraints(p: Dict[str, Any]):
        lf = p.get("looking_for") or {}
        out = []
        if lf.get("any_gender") is not True and lf.get("roommate_gender_categories"):
            out.append(("gender", set(lf["roommate_gender_categories"])))
        if lf.get("smoking_rule") == "required_non_smoking":
            out.append(("nonsmoker", None))
        return out

    for seeker, other in ((profile_a, profile_b), (profile_b, profile_a)):
        for kind, arg in constraints(seeker):
            if kind == "gender":
                ident = other.get("gender_identity") or "prefer_not_to_say"
                if ident not in arg:
                    return False
            elif (other.get("about_me") or {}).get("smoking_status") != "non_smoker":
                return False
    return True


# --------------------------------------------------------------------------
# CP.calculate_match.v1
# --------------------------------------------------------------------------

SOFT_FACTORS = (
    "sleep_schedule", "shared_space_habits", "social_guest_preference",
    "noise_preference", "personal_space_preference", "bill_splitting_style",
)


def calculate_match_a(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> Dict[str, Any]:
    am, bm = profile_a.get("about_me") or {}, profile_b.get("about_me") or {}
    shared = [f for f in SOFT_FACTORS if f in am and f in bm]
    if not shared:
        return {"score": None, "status": "insufficient_data"}
    total = sum(1.0 * (1 - abs(am[f] - bm[f])) for f in shared)
    return {"score": round(100 * total / len(shared)), "status": "scored"}


def calculate_match_b(profile_a: Dict[str, Any], profile_b: Dict[str, Any]) -> Dict[str, Any]:
    am, bm = profile_a.get("about_me") or {}, profile_b.get("about_me") or {}
    common = set(SOFT_FACTORS) & set(am) & set(bm)
    if not common:
        return {"score": None, "status": "insufficient_data"}
    sims = [1 - abs(am[f] - bm[f]) for f in sorted(common)]
    return {"score": int(round(100 * sum(sims) / len(sims))), "status": "scored"}


# --------------------------------------------------------------------------
# CP.validate_institution_email.v1
# --------------------------------------------------------------------------

# Illustrative two-entry allowlist, matching the CP's oracle note. The
# production eight-entry list is configuration and must be verified first.
ALLOWLIST = {"cuhk.edu.hk": "CUHK", "hku.hk": "HKU"}

_EMAIL_RE = re.compile(r"^[^@\s]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$")


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
    if not isinstance(email, str):
        return {"eligible": False, "institution": None}
    m = _EMAIL_RE.match(email.strip())
    if not m:
        return {"eligible": False, "institution": None}
    domain = m.group(1).lower()
    for d, inst in ALLOWLIST.items():
        if domain == d:                   # exact, dot-boundary by construction
            return {"eligible": True, "institution": inst}
    return {"eligible": False, "institution": None}
