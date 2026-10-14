-- RentMate — auth-free roommate matching + REAL in-app chat
-- =====================================================================
-- REWRITTEN for the auth-free model decided on 2026-10-14:
--
--   * The account key is the user's EMAIL. There is NO Supabase Auth sign-up,
--     NO password, NO OTP. The only "auth" is a DOMAIN GATE checked client-side
--     (lib/institutions.ts validateInstitutionEmail). Every other auth feature
--     (password / student-card upload / OTP) is pitch-deck only.
--   * The verification table is DROPPED: nothing about verification is persisted;
--     the domain check is a pure client gate.
--   * area / school from the original draft are folded into campus_district /
--     target_areas (the fields the app actually sends).
--   * RLS is DISABLED for the demo. With no auth.users, auth.uid() would block
--     every read/write. If Auth is added later, re-enable and write policies
--     keyed on a custom email claim, not auth.uid().
--   * Realtime is enabled on messages so two browsers / two accounts chat live.
--
-- NOTE: if the previous (auth.users) version of this migration was already
-- applied, run `supabase db reset` (dev) to re-apply this clean schema.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.gender_identity as enum ('man', 'woman', 'nonbinary', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- roommate_profiles — EMAIL is the identity (no auth.users FK)
-- ---------------------------------------------------------------------------
create table if not exists public.roommate_profiles (
  email           text primary key,
  display_name    text,
  institution     text,
  about_me        jsonb not null default '{}'::jsonb,   -- 6 IP/CP soft factors + smoking_status
  looking_for     jsonb not null default '{}'::jsonb,    -- HARD: any_gender, roommate_gender_categories, smoking_rule
  gender_identity public.gender_identity,
  mbti_type       text check (mbti_type is null or mbti_type ~ '^[IE][SN][TF][JP]$'),
  belief_system   text,
  campus_district text,                                 -- campus anchor (commute origin)
  target_areas    text[],                               -- areas the student will live in
  interests       text[],
  budget_min      integer check (budget_min is null or budget_min >= 0),
  budget_max      integer check (budget_max is null or budget_max >= budget_min),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger roommate_profiles_updated_at
  before update on public.roommate_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages — real in-app chat (Supabase Realtime)
-- id is CLIENT-generated (uuid) so an optimistic append and the Realtime echo
-- dedupe on the same id.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key,
  conversation_id text not null,
  sender_email    text not null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx
  on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- reports — moderation: a user reports another from a conversation
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_email  text not null,
  reported_email  text not null,
  conversation_id text,
  reason          text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- blocks — "end a connection". When A blocks B, BOTH see the conversation gone.
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  id              uuid primary key default gen_random_uuid(),
  blocker_email   text not null,
  blocked_email   text not null,
  created_at      timestamptz not null default now(),
  unique (blocker_email, blocked_email)
);

-- ---------------------------------------------------------------------------
-- The deterministic score — CP.calculate_match.v2, in SQL (reference mirror).
-- The app scores locally (lib/matching.ts); this mirrors the frozen contract and
-- is NOT invoked at runtime. Kept so the canonical lives in one place.
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

  -- BOTH sides must be well-formed on ALL FOUR axes. A previous version of this
  -- checked `substr(ta, 3, 1)` against ('J','P') by way of `tb`, which validated
  -- b's fourth axis twice and never validated a's -- so a malformed 'INTX' on the
  -- a side would still score here, while lib/matching.ts correctly omits MBTI.
  -- The mirror now matches the CP and the TypeScript on all four axes.
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
-- Row Level Security — OFF for the demo (no auth.users; auth.uid() would block all).
-- ---------------------------------------------------------------------------
alter table public.roommate_profiles disable row level security;
alter table public.messages        disable row level security;
alter table public.reports         disable row level security;
alter table public.blocks          disable row level security;

-- ---------------------------------------------------------------------------
-- Realtime — so two browsers / two accounts chat live.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
