-- RentMate — the Homes half: a real listing pool + your own saved state
-- =====================================================================
-- Written 2026-10-14, in response to the owner's review of the Figma demo. Two
-- problems it fixes:
--
--   1. "we may need even more listings in our database." Until now the pool was
--      generated in TypeScript (Figma/src/lib/listings.ts) and never left the
--      browser — 72 rows, identical for everyone, impossible to edit without a
--      redeploy. `demo_listings` puts the pool in the database.
--
--   2. Your saved homes, your notes, which homes are in which conversation, and
--      the viewing you agreed to were all in localStorage, keyed by email. That
--      meant: clear your browser and it is gone, and the other person in the
--      conversation could not see the home you just sent them. `saved_listings`,
--      `conversation_listings` and `viewings` move that to the server.
--
-- FOLLOWS THE AUTH-FREE MODEL of 20261013233000_roommate_matching.sql: the
-- account key is the email address, there is no auth.users, and RLS is DISABLED
-- for the demo. Re-enable it and key the policies on an email claim (not
-- auth.uid()) if Auth is ever added — see the note in that migration.
--
-- ⚠️ `demo_listings` is SYNTHETIC, exactly like the TypeScript pool it mirrors.
-- There is no public per-listing rental API for Hong Kong (see the header of
-- Figma/src/lib/listings.ts for what the open data actually contains), so these
-- rows are generated, not sourced. The `synthetic` flag is not decorative: the
-- UI is expected to keep labelling them.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.listing_status as enum ('available', 'viewing', 'taken');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- demo_listings — the pool the Homes tab browses
-- ---------------------------------------------------------------------------
-- `id` is a plain integer, not a uuid: the TypeScript pool numbers flats 1..N
-- and the client stores saved ids as numbers. Keeping the same key means a row
-- generated offline and a row served from here are interchangeable.
--
-- `image_key` holds only the Unsplash photo id; the URL (with its crop/width
-- parameters) is built client-side, so changing the image sizes does not need a
-- migration. `rooms` is deliberately NOT stored: room splits are derived from
-- `area_sqft` + `bedrooms` by roomsFor() in listings.ts, and duplicating that
-- arithmetic in a jsonb column is how the two get to disagree.
create table if not exists public.demo_listings (
  id            integer primary key,
  title         text not null,
  district      text not null,
  monthly_rent  integer not null check (monthly_rent > 0),
  bedrooms      smallint not null check (bedrooms between 1 and 3),
  bathrooms     smallint not null check (bathrooms between 1 and 2),
  area_sqft     integer not null check (area_sqft between 400 and 1000),
  near_mtr      boolean not null default false,
  rating        numeric(2, 1) not null default 4.0 check (rating between 0 and 5),
  image_key     text not null,
  map_x         numeric(5, 2) not null,
  map_y         numeric(5, 2) not null,
  tips          text[] not null default '{}',
  synthetic     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists demo_listings_district_idx on public.demo_listings (district);
create index if not exists demo_listings_rent_idx on public.demo_listings (monthly_rent);
create index if not exists demo_listings_sqft_idx on public.demo_listings (area_sqft);

-- ---------------------------------------------------------------------------
-- saved_listings — your shortlist, and the notes you wrote on it
-- ---------------------------------------------------------------------------
-- One row per (email, listing). `note` and `status` are the two things that are
-- genuinely YOURS: what you noticed, and where you are with it. They are not
-- per-conversation — that was the owner's point ("save your own views and
-- preferences instead of it being tied to a person/chat").
create table if not exists public.saved_listings (
  email        text not null,
  listing_id   integer not null references public.demo_listings (id) on delete cascade,
  note         text not null default '',
  status       public.listing_status not null default 'available',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (email, listing_id)
);

create index if not exists saved_listings_email_idx on public.saved_listings (email);

drop trigger if exists saved_listings_updated_at on public.saved_listings;
create trigger saved_listings_updated_at
  before update on public.saved_listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversation_listings — a home you sent into a conversation
-- ---------------------------------------------------------------------------
-- This is what makes "did we ever look at that place?" answerable, and what the
-- Messages tab filters on. `added_by_email` is who suggested it, so the other
-- side can tell whose idea it was.
create table if not exists public.conversation_listings (
  conversation_id text not null,
  listing_id      integer not null references public.demo_listings (id) on delete cascade,
  added_by_email  text not null,
  created_at      timestamptz not null default now(),
  primary key (conversation_id, listing_id)
);

create index if not exists conversation_listings_conv_idx
  on public.conversation_listings (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- viewings — the one you actually agreed to
-- ---------------------------------------------------------------------------
-- `when_text` is free text on purpose. The owner's review killed the slot-picker:
-- "the suggest-a-time function is pretty awful; they should discuss by text as
-- per normal, and just have a button to book it in with the listing agency."
-- So the time is whatever the two of you agreed in the chat, and RentMate's job
-- is only to remember it and to remind you.
--
-- `checklist` stores WHICH safety notes were ticked (their titles), not a
-- boolean "read it". A boolean would let a note be added later and silently
-- count as read by everyone who had already confirmed.
create table if not exists public.viewings (
  id              uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  listing_id      integer not null references public.demo_listings (id) on delete cascade,
  match_email     text not null,
  other_email     text not null,
  when_text       text not null check (length(btrim(when_text)) > 0),
  checklist       text[] not null default '{}',
  confirmed       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One live viewing per conversation per listing; re-confirming updates it.
  unique (conversation_id, listing_id)
);

create index if not exists viewings_match_email_idx on public.viewings (match_email);
create index if not exists viewings_conversation_idx on public.viewings (conversation_id);

drop trigger if exists viewings_updated_at on public.viewings;
create trigger viewings_updated_at
  before update on public.viewings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — OFF, matching the auth-free roommate tables.
-- ---------------------------------------------------------------------------
alter table public.demo_listings        disable row level security;
alter table public.saved_listings       disable row level security;
alter table public.conversation_listings disable row level security;
alter table public.viewings             disable row level security;

-- ---------------------------------------------------------------------------
-- Realtime — a home sent into a chat, and a viewing agreed, are both things the
-- OTHER person should see without refreshing.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.conversation_listings;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.viewings;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Seed: demo_listings
-- ---------------------------------------------------------------------------
-- 240 rows — more than the 72 the browser used to generate, which is what the
-- owner asked for ("we may need even more listings in our database").
--
-- ⚠️ These formulas are a DELIBERATE MIRROR of LISTINGS[] in
-- Figma/src/lib/listings.ts. If you change one, change the other, or the offline
-- fallback and the connected pool will quietly disagree about the same flat.
-- The only intended difference is quantity (72 offline vs 240 here).
--
--   sqft          = 400 + (i * 137) % 601                → 400..1000 whole flat
--   perSqft       = 22 + districtPremium * 10 + (i % 5) * 0.8
--   rent          = round(sqft * perSqft / 100) * 100
--   bedrooms      = 1 if sqft < 520, 2 if sqft < 760, else 3
--   map x/y       = district centroid projected onto the canvas, jittered ±2
--
-- districtPremium normalises the district average rent between the cheapest and
-- dearest district on file, so an expensive district costs more per square foot
-- rather than merely sitting in a different row.
do $$
declare
  -- The 12 districts the pool rotates through — LISTING_DISTRICTS in
  -- listings.ts, in the same order, because `i % 12` is how a row picks one.
  districts text[] := array[
    'Sha Tin', 'Tai Wai', 'Kowloon Tong', 'Hung Hom', 'Mong Kok', 'Tai Po',
    'Tseung Kwan O', 'Tuen Mun', 'Kennedy Town', 'Sai Ying Pun',
    'Sham Shui Po', 'Ma On Shan'
  ];
  -- district → [average rent, lat, lng]. Both halves are copied verbatim from
  -- listings.ts: DISTRICT_AVERAGE_RENT and DISTRICT_CENTROIDS. All 17 districts
  -- are here (not just the 12) because the average-rent range that sets the
  -- per-square-foot premium is computed over the whole table, exactly as
  -- CHEAPEST_DISTRICT / DEAREST_DISTRICT do in TypeScript.
  centroids jsonb := jsonb_build_object(
    'Sha Tin',       jsonb_build_array(7500, 22.382,  114.188),
    'Kennedy Town',  jsonb_build_array(9200, 22.282,  114.128),
    'Kowloon Tong',  jsonb_build_array(8400, 22.337,  114.176),
    'Tai Wai',       jsonb_build_array(7100, 22.373,  114.179),
    'Hung Hom',      jsonb_build_array(7800, 22.305,  114.182),
    'Sai Ying Pun',  jsonb_build_array(9500, 22.286,  114.142),
    'Tai Po',        jsonb_build_array(6300, 22.45,   114.168),
    'Tseung Kwan O', jsonb_build_array(6900, 22.308,  114.26),
    'Mong Kok',      jsonb_build_array(8200, 22.319,  114.169),
    'Tuen Mun',      jsonb_build_array(5900, 22.391,  113.977),
    'Ma On Shan',    jsonb_build_array(6700, 22.4247, 114.231),
    'Fo Tan',        jsonb_build_array(6800, 22.395,  114.192),
    'Ho Man Tin',    jsonb_build_array(8100, 22.3095, 114.1825),
    'Yau Ma Tei',    jsonb_build_array(7900, 22.3126, 114.1703),
    'Sham Shui Po',  jsonb_build_array(7000, 22.3302, 114.1622),
    'Wan Chai',      jsonb_build_array(9300, 22.2775, 114.1731),
    'North Point',   jsonb_build_array(8800, 22.291,  114.2003)
  );
  adjectives text[] := array[
    'Sunlit', 'Quiet', 'Warm', 'Renovated', 'Bright', 'Calm', 'Modern',
    'High-floor', 'Cosy', 'Airy', 'Minimal', 'Freshly updated', 'Practical',
    'Peaceful', 'Sunny', 'Furnished', 'Value', 'Move-in ready', 'Comfortable',
    'Open-plan', 'Corner', 'Garden-facing'
  ];
  flat_types text[] := array[
    'two-bedroom near MTR', 'flat with harbour light', 'compact student home',
    'walk-up by the park', 'two-bedroom with study nook', 'flat near campus',
    'home above the market', 'flat with open kitchen', 'home with city view',
    'two-bedroom on a quiet lane', 'flat beside the station',
    'home with separate bedrooms'
  ];
  flat_images text[] := array[
    'photo-1738168246881-40f35f8aba0a', 'photo-1668566398322-6bbc9be03736',
    'photo-1556593825-c11de986cb0b', 'photo-1761123141836-3b3221dac3e5',
    'photo-1779785689520-bf24ef13aa71', 'photo-1774311237295-a65a4c1ff38a',
    'photo-1759691555010-7f3f8674d2f2', 'photo-1502672260266-1c1ef2d93688',
    'photo-1522708323590-d24dbb6b0267'
  ];
  -- 22 pre-written "AI" comments. Dollar-quoted because two of them contain an
  -- apostrophe ("'furnished'", "Two months' deposit").
  tips_pool text[] := array[
    $t$The photos show a window in every bedroom — rare at this size in this district.$t$,
    $t$Two minutes further from the station than the listing suggests; check the walk at night.$t$,
    $t$Priced just under the district average for this size. Worth a viewing this week.$t$,
    $t$Listed three weeks ago. In this district that usually means the price is negotiable.$t$,
    $t$Ground-floor unit — ask about damp, and about the window locks specifically.$t$,
    $t$Split across two bedrooms this lands near your budget. Across three, it does not.$t$,
    $t$The building has a lift. Many walk-ups here do not, and that matters with luggage.$t$,
    $t$Kitchen looks recently redone; the bathroom looks original.$t$,
    $t$Short journey on paper, but the last stretch is uphill. Consider it in August.$t$,
    $t$No agency fee listed — which is the whole point. Get that in writing before you view.$t$,
    $t$Bedroom sizes are unequal. Agree who takes which before anyone signs anything.$t$,
    $t$Ask whether the quoted rent covers management fees and rates. Often it does not.$t$,
    $t$Close to a wet market: lively mornings, cheap afternoons.$t$,
    $t$Older than the photos imply. Check the water pressure and how the windows close.$t$,
    $t$Several units in this block listed last month — high turnover, ask why.$t$,
    $t$The study nook is a converted balcony. Fine for a desk, not for a bed.$t$,
    $t$Furnished — but check what 'furnished' means here before you plan the move.$t$,
    $t$Good afternoon light. Worth seeing at the hour you'd actually be home.$t$,
    $t$Air-conditioning units look new; the plumbing is untested in these photos.$t$,
    $t$Two bathrooms for three bedrooms — the morning queue is real.$t$,
    $t$Near a major road. Visit at rush hour before you commit.$t$,
    $t$Two months' deposit requested. Standard here, but budget for it.$t$
  ];
  total integer := 240;
  cheapest numeric;
  dearest numeric;
  i integer;
  area text;
  sqft integer;
  per_sqft numeric;
  rent integer;
  beds smallint;
  baths smallint;
  premium numeric;
  lat numeric;
  lng numeric;
  map_x numeric;
  map_y numeric;
  jitter integer;
begin
  -- The pool is regenerated from scratch so re-running is idempotent and the
  -- formulas stay the single story. Saved rows cascade away with it.
  delete from public.demo_listings;

  select min((value ->> 0)::numeric), max((value ->> 0)::numeric)
    into cheapest, dearest
    from jsonb_each(centroids);

  for i in 0..(total - 1) loop
    area := districts[(i % array_length(districts, 1)) + 1];
    lat := (centroids -> area ->> 1)::numeric;
    lng := (centroids -> area ->> 2)::numeric;

    sqft := 400 + ((i * 137) % 601);
    premium := (((centroids -> area ->> 0)::numeric - cheapest) / nullif(dearest - cheapest, 0));
    per_sqft := 22 + premium * 10 + (i % 5) * 0.8;
    rent := round(sqft * per_sqft / 100) * 100;

    beds := case when sqft < 520 then 1 when sqft < 760 then 2 else 3 end;
    baths := case when beds >= 3 then 2 else 1 end;

    -- Project the centroid onto the map canvas, then jitter ±2% so pins do not
    -- stack on top of each other in the same district.
    map_x := ((lng - 113.94) / (114.3 - 113.94)) * 100;
    map_y := ((22.52 - lat) / (22.52 - 22.24)) * 100;
    jitter := ((i * 11) % 5) - 2;
    map_x := greatest(4, least(94, map_x + jitter));
    map_y := greatest(6, least(92, map_y + jitter));

    insert into public.demo_listings (
      id, title, district, monthly_rent, bedrooms, bathrooms, area_sqft,
      near_mtr, rating, image_key, map_x, map_y, tips, synthetic
    ) values (
      i + 1,
      adjectives[(i % array_length(adjectives, 1)) + 1] || ' ' ||
        flat_types[((i * 5) % array_length(flat_types, 1)) + 1],
      area,
      rent,
      beds,
      baths,
      sqft,
      (i * 7) % 10 < 7,
      round((4.4 + ((i * 3) % 6) / 10.0)::numeric, 1),
      flat_images[(i % array_length(flat_images, 1)) + 1],
      round(map_x, 2),
      round(map_y, 2),
      -- Mirrors pick(AI_TIPS, i + 1, 2): index = (seed * (k + 3) + k * 7) % 22
      -- with seed = i + 1, k = 0 then 1.
      array[
        tips_pool[(((i + 1) * 3) % 22) + 1],
        tips_pool[(((i + 1) * 4 + 7) % 22) + 1]
      ],
      true
    );
  end loop;
end $$;
