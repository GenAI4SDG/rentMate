-- Geocode cache for Nominatim (backend server only; not exposed to browser)

create table if not exists public.geocode_cache (
  address_key text primary key,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  display_name text,
  boundingbox jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nearby_places_cache (
  cache_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists nearby_places_cache_created_at_idx
  on public.nearby_places_cache (created_at);

alter table public.geocode_cache enable row level security;
alter table public.nearby_places_cache enable row level security;

-- No client policies: only service role / direct DB connection from API server
