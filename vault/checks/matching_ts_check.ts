// Runs the shipped TypeScript matcher against the two CP oracles in vault/cps/:
//   - CP.calculate_match.v2         (8 cases, the soft score)
//   - CP.filter_eligible_matches.v2 (17 cases, the hard gate)
//
// This is the cross-check the CPs' oracle_origin notes claim: the expected
// values were derived from the stated contracts, then re-run against the real
// implementation (this file). If the matcher and a CP ever disagree, the CP is
// stale — fix the CP (new version) or the code, and say which.
//
// Run: node --experimental-strip-types vault/checks/matching_ts_check.ts
import { calculateMatch, filterEligible } from "../../Figma/src/lib/matching.ts";

type ScoreCase = { note: string; a: any; b: any; score: number | null; status: string };
type FilterCase = { note: string; a: any; b: any; eligible: boolean };

const scoreCases: ScoreCase[] = [
  {
    note: "identical profiles, all seven factors agree -> 100",
    a: { about_me: { sleep_schedule: 0.5, shared_space_habits: 0.5, social_guest_preference: 0.5, noise_preference: 0.5, personal_space_preference: 0.5, bill_splitting_style: 0.5 }, mbti_type: "INTJ" },
    b: { about_me: { sleep_schedule: 0.5, shared_space_habits: 0.5, social_guest_preference: 0.5, noise_preference: 0.5, personal_space_preference: 0.5, bill_splitting_style: 0.5 }, mbti_type: "INTJ" },
    score: 100, status: "scored",
  },
  { note: "one shared factor at opposite extremes -> 0", a: { about_me: { sleep_schedule: 0.0 } }, b: { about_me: { sleep_schedule: 1.0 } }, score: 0, status: "scored" },
  { note: "no shared factor -> null / insufficient_data", a: { about_me: { sleep_schedule: 0.5 } }, b: { about_me: { noise_preference: 0.5 } }, score: null, status: "insufficient_data" },
  {
    note: "gender invariance -> 100",
    a: { gender_identity: "man", mbti_type: "INTJ", about_me: { sleep_schedule: 0.5 } },
    b: { gender_identity: "woman", mbti_type: "INTJ", about_me: { sleep_schedule: 0.5 } },
    score: 100, status: "scored",
  },
  { note: "renormalization -> 75", a: { about_me: { sleep_schedule: 1.0, noise_preference: 0.0 } }, b: { about_me: { sleep_schedule: 0.5, noise_preference: 0.0, social_guest_preference: 1.0 } }, score: 75, status: "scored" },
  { note: "MBTI all four axes differ -> 50", a: { mbti_type: "INTJ", about_me: { sleep_schedule: 1.0 } }, b: { mbti_type: "ESFP", about_me: { sleep_schedule: 1.0 } }, score: 50, status: "scored" },
  { note: "MBTI partial (1 axis) -> 75", a: { mbti_type: "INTJ" }, b: { mbti_type: "INFJ" }, score: 75, status: "scored" },
  { note: "MBTI absent -> renormalized -> 50", a: { mbti_type: "INTJ", about_me: { sleep_schedule: 1.0 } }, b: { about_me: { sleep_schedule: 0.5 } }, score: 50, status: "scored" },
];

// The 17 cases of CP.filter_eligible_matches.v2's oracle, in the CP's order.
const filterCases: FilterCase[] = [
  { note: "1 mutual gender-category match", a: { gender_identity: "woman", looking_for: { roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference" } }, b: { gender_identity: "woman", looking_for: { roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference" } }, eligible: true },
  { note: "2 gender mismatch", a: { gender_identity: "man", looking_for: { roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference" } }, b: { gender_identity: "man", looking_for: { roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference" } }, eligible: false },
  { note: "3 undisclosed gender fails a stated category", a: { gender_identity: "woman", looking_for: { roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference" } }, b: { gender_identity: "prefer_not_to_say", looking_for: { roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference" } }, eligible: false },
  { note: "4 any_gender disables the filter", a: { gender_identity: "man", looking_for: { any_gender: true, smoking_rule: "no_preference" } }, b: { gender_identity: "woman", looking_for: { any_gender: true, smoking_rule: "no_preference" } }, eligible: true },
  { note: "5 explicit non-smoking rule is hard", a: { gender_identity: "woman", about_me: { smoking_status: 1 }, looking_for: { any_gender: true, smoking_rule: "required_non_smoking" } }, b: { gender_identity: "woman", about_me: { smoking_status: 0 }, looking_for: { any_gender: true, smoking_rule: "no_preference" } }, eligible: false },
  { note: "6 belief happy path", a: { gender_identity: "woman", looking_for: { any_gender: true, belief_systems: ["buddhist"] } }, b: { gender_identity: "man", belief_system: "buddhist" }, eligible: true },
  { note: "7 belief mismatch", a: { gender_identity: "woman", looking_for: { any_gender: true, belief_systems: ["buddhist"] } }, b: { gender_identity: "man", belief_system: "christian" }, eligible: false },
  { note: "8 undisclosed belief fails a stated requirement", a: { gender_identity: "woman", looking_for: { any_gender: true, belief_systems: ["buddhist"] } }, b: { gender_identity: "man" }, eligible: false },
  { note: "9 belief bidirectionality (theirs fires)", a: { gender_identity: "woman", belief_system: "christian" }, b: { gender_identity: "man", looking_for: { any_gender: true, belief_systems: ["buddhist"] } }, eligible: false },
  { note: "10 location within limit; other side silent on budget", a: { looking_for: { any_gender: true, max_commute_minutes: 30, budget_max: 10000 }, campus_district: "Sha Tin" }, b: { gender_identity: "woman", area: "Tai Wai" }, eligible: true },
  { note: "11 location over limit", a: { looking_for: { any_gender: true, max_commute_minutes: 30 }, campus_district: "Sha Tin" }, b: { gender_identity: "woman", area: "Tuen Mun" }, eligible: false },
  { note: "12 unknown district never silently excludes", a: { looking_for: { any_gender: true, max_commute_minutes: 30 }, campus_district: "Sha Tin" }, b: { gender_identity: "woman", area: "Atlantis" }, eligible: true },
  { note: "13 budget: their floor over your ceiling", a: { gender_identity: "woman", looking_for: { any_gender: true, budget_max: 10000 } }, b: { gender_identity: "man", budget_min: 12000 }, eligible: false },
  { note: "14 budget floor fallback: budget_max stands in", a: { gender_identity: "woman", looking_for: { any_gender: true, budget_max: 10000 } }, b: { gender_identity: "man", budget_max: 11000 }, eligible: false },
  { note: "15 budget bidirectionality (their ceiling, your floor)", a: { gender_identity: "man", budget_min: 12000 }, b: { gender_identity: "woman", looking_for: { any_gender: true, budget_max: 10000 } }, eligible: false },
  { note: "16 flat size is NOT a gate", a: { gender_identity: "woman", looking_for: { any_gender: true, flat_size_min: 600 } }, b: { gender_identity: "man", flat_size: 300 }, eligible: true },
  { note: "17 smoking bidirectionality (theirs fires)", a: { gender_identity: "woman", about_me: { smoking_status: 0 } }, b: { gender_identity: "man", looking_for: { any_gender: true, smoking_rule: "required_non_smoking" } }, eligible: false },
];

let failures = 0;
scoreCases.forEach((c, i) => {
  const got = calculateMatch(c.a, c.b);
  const ok = got.score === c.score && got.status === c.status;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  score case ${i}  expected ${c.score}/${c.status}  got ${got.score}/${got.status}  — ${c.note}`,
  );
});

console.log("");
filterCases.forEach((c, i) => {
  const got = filterEligible(c.a, c.b);
  const ok = got === c.eligible;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  filter case ${i}  expected ${c.eligible}  got ${got}  — ${c.note}`,
  );
});

console.log(`\n${scoreCases.length + filterCases.length - failures}/${scoreCases.length + filterCases.length} passed`);
process.exit(failures ? 1 : 0);
