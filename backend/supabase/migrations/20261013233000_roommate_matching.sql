-- RentMate — roommate matching flow (student verification, quiz, deterministic score)
--
-- WHY THIS MIGRATION EXISTS
-- The init migration (20260313120000) implements the LANDLORD/TENANT marketplace
-- spec. The RentMate product is a STUDENT ROOMMATE matcher, and its tables were
-- never added — the backend README says so in as many words. This migration adds
-- the roommate flow on top, without touching the marketplace tables.
--
-- The deterministic score lives here, server-side, so the client never has to be
-- trusted for it and RLS can stay strict. It mirrors the frozen contract
-- CP.calculate_match.v2 (vault/cps/): seven equal-weight factors, MBTI scored as
-- 1 - differing_axes/4, a factor present on one side only is dropped and the rest
-- renormalized, and no shared factor yields NULL rather than a fabricated 0.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.gender_identity as enum ('man', 'woman', 'nonbinary', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- student_verifications — the ACCESS GATE (eligibility, NOT identity verification)
-- Stores a boolean attestation only: never the email body, never a document.
-- ---------------------------------------------------------------------------
create table if not exists public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email_domain text not null,
  institution text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, email_domain)
);

create index if not exists student_verifications_user_idx
  on public.student_verifications (user_id);

-- ---------------------------------------------------------------------------
-- roommate_profiles — the profile matching runs on
-- ---------------------------------------------------------------------------
create table if not exists public.roommate_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  school text,
  -- Scored/compared attributes, normalised 0..1 where scalar.
  about_me jsonb not null default '{}'::jsonb,
  -- Hard-constraint declarations (never scored): roommate_gender_categories, any_gender, smoking_rule.
  looking_for jsonb not null default '{}'::jsonb,
  gender_identity public.gender_identity,
  mbti_type text check (mbti_type is null or mbti_type ~ '^[IE][SN][TF][JP]$'),
  area text,
  budget_min integer check (budget_min is null or budget_min >= 0),
  budget_max integer check (budget_max is null or budget_max >= budget_min),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger roommate_profiles_updated_at
  before update on public.roommate_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quiz_answers — one row per answered question (the 12-question demo quiz)
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  factor text not null,
  value numeric,
  option_index integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists quiz_answers_user_idx on public.quiz_answers (user_id);

-- ---------------------------------------------------------------------------
-- match_results — the computed score + the GenAI narrative for a candidate pair
-- ---------------------------------------------------------------------------
create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  candidate_id uuid not null references auth.users (id) on delete cascade,
  score integer check (score is null or (score >= 0 and score <= 100)),
  status text not null default 'scored' check (status in ('scored', 'insufficient_data')),
  narrative text,
  matched_factors jsonb not null default '[]'::jsonb,
  friction_factors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, candidate_id)
);

create index if not exists match_results_user_idx on public.match_results (user_id);

-- ---------------------------------------------------------------------------
-- The deterministic score — CP.calculate_match.v2, in SQL
--   vᵢ = 1 - |aᵢ - bᵢ|                  for a soft scalar factor
--   v_mbti = 1 - differing_axes/4        over E/I, S/N, T/F, J/P
--   score = round(100 * Σ vᵢ / n)        over SHARED factors only
-- ---------------------------------------------------------------------------
create or replace function public.calculate_match_score(a jsonb, b jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  factors text[] := array[
    'sleep_schedule', 'shared_space_habits', 'social_guest_preference',
    'noise_preference', 'personal_space_preference', 'bill_splitting_style'
  ];
  am jsonb := coalesce(a -> 'about_me', '{}'::jsonb);
  bm jsonb := coalesce(b -> 'about_me', '{}'::jsonb);
  f text;
  av numeric;
  bv numeric;
  total numeric := 0;
  n integer := 0;
  factor_sims jsonb := '{}'::jsonb;
  ta text := upper(coalesce(a ->> 'mbti_type', ''));
  tb text := upper(coalesce(b ->> 'mbti_type', ''));
  wellformed boolean;
  diff integer := 0;
  i integer;
begin
  foreach f in array factors loop
    if am ? f and bm ? f then
      av := (am ->> f)::numeric;
      bv := (bm ->> f)::numeric;
      total := total + (1 - abs(av - bv));
      factor_sims := factor_sims || jsonb_build_object(f, 1 - abs(av - bv));
      n := n + 1;
    end if;
  end loop;

  wellformed := length(ta) = 4 and length(tb) = 4
    and substr(ta, 1, 1) in ('I', 'E') and substr(ta, 2, 1) in ('S', 'N')
    and substr(ta, 3, 1) in ('T', 'F') and substr(ta, 4, 1) in ('J', 'P')
    and substr(tb, 1, 1) in ('I', 'E') and substr(tb, 2, 1) in ('S', 'N')
    and substr(tb, 3, 1) in ('T', 'F') and substr(tb, 4, 1) in ('J', 'P');

  if wellformed then
    for i in 1..4 loop
      if substr(ta, i, 1) <> substr(tb, i, 1) then
        diff := diff + 1;
      end if;
    end loop;
    total := total + (1 - diff::numeric / 4);
    factor_sims := factor_sims || jsonb_build_object('mbti', 1 - diff::numeric / 4);
    n := n + 1;
  end if;

  if n = 0 then
    return jsonb_build_object('score', null, 'status', 'insufficient_data', 'factors', '{}'::jsonb);
  end if;

  return jsonb_build_object(
    'score', round(100 * total / n)::integer,
    'status', 'scored',
    'factors', factor_sims
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.student_verifications enable row level security;
alter table public.roommate_profiles      enable row level security;
alter table public.quiz_answers           enable row level security;
alter table public.match_results          enable row level security;

-- student_verifications: a user sees and writes only their own attestation.
create policy "own verification read"   on public.student_verifications
  for select using (auth.uid() = user_id);
create policy "own verification write"  on public.student_verifications
  for insert with check (auth.uid() = user_id);
create policy "own verification update" on public.student_verifications
  for update using (auth.uid() = user_id);

-- roommate_profiles: any signed-in student may READ the pool (matching needs it),
-- but may only write their own row.
create policy "signed-in read pool" on public.roommate_profiles
  for select using (auth.role() = 'authenticated');
create policy "own profile insert"  on public.roommate_profiles
  for insert with check (auth.uid() = user_id);
create policy "own profile update"  on public.roommate_profiles
  for update using (auth.uid() = user_id);

-- quiz_answers: strictly private to the owner.
create policy "own answers read"   on public.quiz_answers
  for select using (auth.uid() = user_id);
create policy "own answers write"  on public.quiz_answers
  for insert with check (auth.uid() = user_id);
create policy "own answers update" on public.quiz_answers
  for update using (auth.uid() = user_id);

-- match_results: a user sees only their own computed matches.
create policy "own matches read"  on public.match_results
  for select using (auth.uid() = user_id);
create policy "own matches write" on public.match_results
  for insert with check (auth.uid() = user_id);
