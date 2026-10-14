-- RentMate — profile display fields: study year and major
-- ===========================================================================
-- WHY THIS MIGRATION EXISTS
--
-- The owner asked (14 Oct, second review): "why is info like study year and
-- major available in the profile but not in the quiz?"
--
-- It wasn't available anywhere. The curated demo cast in
-- `Figma/src/lib/demoData.ts` writes "CUHK · Year 2 · Sociology" into its
-- `school` string, so the cast LOOKED like it carried a year and a field of
-- study — but there was no column, no Profile field, and no question. The
-- owner's own profile therefore showed a university and nothing else.
--
-- Two additive columns fix that. Both are DISPLAY ONLY:
--   * neither is a matching factor (SOFT_FACTORS in Figma/src/lib/matching.ts
--     is unchanged, and CP.calculate_match.v2 is untouched),
--   * neither is a gate (CP.filter_eligible_matches.v1 is untouched).
-- They are shown on the account chip and read back by `rowToProfile`.
--
-- `major` is free text rather than an enum on purpose: the demo cast says
-- "Sociology", "Journalism", "Architecture", "Chinese Literature" — a faculty
-- list would flatten all four to "Social sciences" and lose the only part a
-- human actually reads.
--
-- ADDITIVE AND IDEMPOTENT. Nothing above this file is altered, no data is
-- touched, and re-running it is a no-op. It is safe to apply to a database that
-- already has rows.
-- ===========================================================================

alter table public.roommate_profiles
  add column if not exists study_year text;

alter table public.roommate_profiles
  add column if not exists major text;

comment on column public.roommate_profiles.study_year is
  'Year of study as displayed on the profile ("Year 2", "Postgraduate", "Exchange"). Display only — never scored, never a gate.';

comment on column public.roommate_profiles.major is
  'Field of study, free text ("Sociology", "Architecture"). Display only — never scored, never a gate.';
