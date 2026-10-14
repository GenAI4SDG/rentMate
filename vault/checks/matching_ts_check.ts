// Checks the TypeScript matcher against CP.calculate_match.v2's oracle.
// Run: node --experimental-strip-types vault/checks/matching_ts_check.ts
import { calculateMatch } from "../../Figma/src/lib/matching.ts";

type Case = { note: string; a: any; b: any; score: number | null; status: string };

const cases: Case[] = [
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

let failures = 0;
cases.forEach((c, i) => {
  const got = calculateMatch(c.a, c.b);
  const ok = got.score === c.score && got.status === c.status;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  case ${i}  expected ${c.score}/${c.status}  got ${got.score}/${got.status}  — ${c.note}`,
  );
});

console.log(`\n${cases.length - failures}/${cases.length} passed`);
process.exit(failures ? 1 : 0);
