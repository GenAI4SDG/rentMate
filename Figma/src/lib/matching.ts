// Deterministic matching logic — the TypeScript twin of the SQL function
// `public.calculate_match_score` and of the frozen contracts in `vault/cps/`:
//   - CP.calculate_match.v2         (the soft score)
//   - CP.filter_eligible_matches.v1 (the hard gate)
//
// THE SPLIT, as the owner defined it:
//   SOFT  (scored, conflation is fine): lifestyle scalars + MBTI.
//   HARD  (gate before scoring, never scored): gender/identity, belief system,
//         target location, target size/price range, smoking.
//
// This file is deliberately SELF-CONTAINED (no imports) so the oracle check
// `vault/checks/matching_ts_check.ts` can import it directly.

export type GenderIdentity = "man" | "woman" | "nonbinary" | "prefer_not_to_say";

/** Hard constraints. An absent/empty value means "no constraint", never "reject all". */
export type LookingFor = {
  any_gender?: boolean;
  roommate_gender_categories?: GenderIdentity[] | null;
  any_belief?: boolean;
  belief_systems?: string[] | null;
  /** Maximum acceptable commute to the seeker's campus, in minutes. */
  max_commute_minutes?: number | null;
  /** Upper bound on monthly rent the seeker will pay. */
  budget_max?: number | null;
  /** Minimum acceptable room size in sq ft. */
  room_size_min?: number | null;
  smoking_rule?: "required_non_smoking" | "no_preference" | null;
};

export type Profile = {
  gender_identity?: GenderIdentity | null;
  belief_system?: string | null;
  mbti_type?: string | null;
  /** District of the user's institution — the commute anchor. */
  campus_district?: string | null;
  /** District the user wants to live in — the primary target. */
  area?: string | null;
  /** All districts the user would consider. `area` is normally `target_areas[0]`. */
  target_areas?: string[] | null;
  budget_min?: number | null;
  budget_max?: number | null;
  room_size?: number | null;
  /** Free-form shared vocabulary; drives the icebreaker hooks, never the score. */
  interests?: string[] | null;
  /** Soft scalar factors, normalised 0..1. `smoking_status` is 1 = non-smoking. */
  about_me?: Record<string, number>;
  looking_for?: LookingFor | null;
};

export type MatchResult = {
  score: number | null;
  status: "scored" | "insufficient_data";
  factors: Record<string, number>;
};

export const SOFT_FACTORS = [
  "sleep_schedule",
  "shared_space_habits",
  "social_guest_preference",
  "noise_preference",
  "personal_space_preference",
  "bill_splitting_style",
] as const;

const AXES = ["IE", "SN", "TF", "JP"] as const;

function wellFormedMbti(t: unknown): t is string {
  if (typeof t !== "string" || t.length !== 4) return false;
  const u = t.toUpperCase();
  return AXES.every((pair, i) => pair.includes(u[i]));
}

/** CP.calculate_match.v2 — weighted similarity over shared factors, renormalised. */
export function calculateMatch(a: Profile, b: Profile): MatchResult {
  const am = a.about_me ?? {};
  const bm = b.about_me ?? {};
  const factors: Record<string, number> = {};
  let total = 0;
  let n = 0;

  for (const f of SOFT_FACTORS) {
    if (typeof am[f] === "number" && typeof bm[f] === "number") {
      const v = 1 - Math.abs(am[f] - bm[f]);
      factors[f] = v;
      total += v;
      n += 1;
    }
  }

  const ta = a.mbti_type;
  const tb = b.mbti_type;
  if (wellFormedMbti(ta) && wellFormedMbti(tb)) {
    const A = ta.toUpperCase();
    const B = tb.toUpperCase();
    let diff = 0;
    for (let i = 0; i < 4; i += 1) if (A[i] !== B[i]) diff += 1;
    const v = 1 - diff / 4;
    factors.mbti = v;
    total += v;
    n += 1;
  }

  if (n === 0) return { score: null, status: "insufficient_data", factors: {} };
  return { score: Math.round((100 * total) / n), status: "scored", factors };
}

// --- location model ----------------------------------------------------------
// No commute API is in play, so this is a transparent ESTIMATE: district
// centroids + a fixed boarding cost + distance at an average MTR-and-walk speed.
// ⚠️ Illustrative — good enough for "is this within my hour?", not a journey quote.

export const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Sha Tin": [22.382, 114.188],
  "Tai Wai": [22.373, 114.179],
  "Ma On Shan": [22.4247, 114.231],
  "Fo Tan": [22.395, 114.192],
  "Kowloon Tong": [22.337, 114.176],
  "Ho Man Tin": [22.3095, 114.1825],
  "Hung Hom": [22.305, 114.182],
  "Mong Kok": [22.319, 114.169],
  "Yau Ma Tei": [22.3126, 114.1703],
  "Sham Shui Po": [22.3302, 114.1622],
  "Sai Ying Pun": [22.286, 114.142],
  "Kennedy Town": [22.282, 114.128],
  "Wan Chai": [22.2775, 114.1731],
  "North Point": [22.291, 114.2003],
  "Tai Po": [22.45, 114.168],
  "Tseung Kwan O": [22.308, 114.26],
  "Tuen Mun": [22.391, 113.977],
};

/** The districts a student can pick as a target area, in map order. */
export const TARGET_AREA_OPTIONS = Object.keys(DISTRICT_COORDS);

const BOARDING_MINUTES = 10;
const MINUTES_PER_KM = 2.4;

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estimated door-to-campus minutes between two districts, or null if unknown. */
export function commuteMinutes(from: string, to: string): number | null {
  const a = DISTRICT_COORDS[from];
  const b = DISTRICT_COORDS[to];
  if (!a || !b) return null;
  return Math.round(BOARDING_MINUTES + haversineKm(a, b) * MINUTES_PER_KM);
}

/**
 * The "is this area right for me?" helper. Rule-based and offline on purpose —
 * it explains the estimate rather than asking a model to guess.
 */
export function areaFit(
  area: string,
  campusDistrict: string,
  toleranceMinutes: number | null,
): { minutes: number; withinTolerance: boolean | null; note: string } | null {
  const minutes = commuteMinutes(area, campusDistrict);
  if (minutes === null) return null;
  const withinTolerance =
    toleranceMinutes === null ? null : minutes <= toleranceMinutes;
  return {
    minutes,
    withinTolerance,
    note:
      withinTolerance === null
        ? `About ${minutes} min to ${campusDistrict} (estimated).`
        : withinTolerance
          ? `About ${minutes} min to ${campusDistrict} — inside your ${toleranceMinutes} min limit.`
          : `About ${minutes} min to ${campusDistrict} — over your ${toleranceMinutes} min limit.`,
  };
}

// --- the hard gate -----------------------------------------------------------
// Each check returns null when it passes, or the reason it failed. Reasons are
// kept (rather than collapsed to a boolean) so the UI can show *why* someone was
// hidden — the gate is the differentiator, so it should be visible, not silent.

export type GateFinding = {
  /** Which constraint fired. */
  field:
    | "gender"
    | "belief"
    | "smoking"
    | "location"
    | "budget"
    | "room_size";
  /** Whose requirement fired: the seeker's or the other person's. */
  side: "you" | "them";
  /** Human sentence for the "we hid these people because…" list. */
  text: string;
};

function genderReason(seeker: Profile, other: Profile, side: "you" | "them"): string | null {
  const lf = seeker.looking_for ?? {};
  if (lf.any_gender === true) return null;
  const cats = lf.roommate_gender_categories;
  if (!cats || cats.length === 0) return null;
  const ident = other.gender_identity;
  // An undisclosed identity never satisfies a stated requirement.
  if (!ident || ident === "prefer_not_to_say") {
    return side === "you"
      ? "You asked to live with a specific gender and they haven't shared theirs"
      : "They asked to live with a specific gender and you haven't shared yours";
  }
  if (cats.includes(ident)) return null;
  return side === "you"
    ? "Your roommate-gender preference rules them out"
    : "Their roommate-gender preference rules you out";
}

function beliefReason(seeker: Profile, other: Profile, side: "you" | "them"): string | null {
  const lf = seeker.looking_for ?? {};
  if (lf.any_belief === true) return null;
  const wanted = lf.belief_systems;
  if (!wanted || wanted.length === 0) return null;
  const theirs = other.belief_system;
  if (theirs && wanted.includes(theirs)) return null;
  if (!theirs) {
    return side === "you"
      ? "You asked for a shared belief system and they haven't shared theirs"
      : "They asked for a shared belief system and you haven't shared yours";
  }
  return side === "you"
    ? "You asked for a flatmate who shares your belief system"
    : "They asked for a flatmate who shares theirs";
}

function smokingReason(seeker: Profile, other: Profile, side: "you" | "them"): string | null {
  if ((seeker.looking_for ?? {}).smoking_rule !== "required_non_smoking") return null;
  // smoking_status 1 == non-smoking (the only value that satisfies the rule).
  if (other.about_me?.smoking_status === 1) return null;
  return side === "you"
    ? "You asked for a smoke-free home"
    : "They asked for a smoke-free home";
}

function locationReason(seeker: Profile, other: Profile, side: "you" | "them"): string | null {
  const limit = (seeker.looking_for ?? {}).max_commute_minutes;
  if (limit === null || limit === undefined) return null;
  const campus = seeker.campus_district;
  const area = other.area;
  if (!campus || !area) return null; // unknown -> never silently exclude
  const minutes = commuteMinutes(area, campus);
  if (minutes === null) return null;
  if (minutes <= limit) return null;
  return side === "you"
    ? `${area} is about ${minutes} min from your campus — past your ${limit} min limit`
    : `Your area is about ${commuteMinutes(seeker.area ?? "", other.campus_district ?? "") ?? "?"} min from their campus — past their ${limit} min limit`;
}

function budgetReason(seeker: Profile, other: Profile, side: "you" | "them"): string | null {
  const cap = (seeker.looking_for ?? {}).budget_max;
  if (cap === null || cap === undefined) return null;
  const theirFloor = other.budget_min ?? other.budget_max;
  if (theirFloor === null || theirFloor === undefined) return null;
  if (theirFloor <= cap) return null;
  return side === "you"
    ? `Their budget starts above your $${cap.toLocaleString("en-US")} ceiling`
    : `Your budget is below their $${theirFloor.toLocaleString("en-US")} floor`;
}

function roomSizeReason(seeker: Profile, other: Profile, side: "you" | "them"): string | null {
  const min = (seeker.looking_for ?? {}).room_size_min;
  if (min === null || min === undefined) return null;
  const theirs = other.room_size;
  if (theirs === null || theirs === undefined) return null;
  if (theirs >= min) return null;
  return side === "you"
    ? `Their room is smaller than the ${min} sq ft you asked for`
    : `Your room is smaller than the ${min} sq ft they asked for`;
}

/** CP.filter_eligible_matches.v1 — every hard constraint, both directions. */
export function filterReasons(seeker: Profile, other: Profile): GateFinding[] {
  const pairs: Array<[GateFinding["field"], string | null, string | null]> = [
    ["gender", genderReason(seeker, other, "you"), genderReason(other, seeker, "them")],
    ["belief", beliefReason(seeker, other, "you"), beliefReason(other, seeker, "them")],
    ["smoking", smokingReason(seeker, other, "you"), smokingReason(other, seeker, "them")],
    ["location", locationReason(seeker, other, "you"), locationReason(other, seeker, "them")],
    ["budget", budgetReason(seeker, other, "you"), budgetReason(other, seeker, "them")],
    ["room_size", roomSizeReason(seeker, other, "you"), roomSizeReason(other, seeker, "them")],
  ];
  const out: GateFinding[] = [];
  for (const [field, yours, theirs] of pairs) {
    if (yours) out.push({ field, side: "you", text: yours });
    if (theirs) out.push({ field, side: "them", text: theirs });
  }
  return out;
}

export function filterEligible(a: Profile, b: Profile): boolean {
  return filterReasons(a, b).length === 0;
}

/** Kept for callers that only want the location verdict. */
export function locationAllows(seeker: Profile, other: Profile): boolean {
  return locationReason(seeker, other, "you") === null;
}
