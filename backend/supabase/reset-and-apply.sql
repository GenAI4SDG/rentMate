-- =============================================================================
-- reset-and-apply.sql  —  ONE-SHOT schema reset for the RentMate demo project
-- =============================================================================
-- WHY THIS EXISTS
--   The live project (ghvonvhpcmozpsfzuexo / jfjhpnwlfgdtspkzlltp) carried an
--   OLDER, auth-based schema. Every roommate migration used `create table if not
--   exists`, which is a SILENT no-op against a table of the same name that
--   already exists with a different shape. Re-running the migrations (or
--   `supabase db push`) therefore left columns missing and only the writes
--   failing.
--
--   The init migration ALSO defines public.messages / public.reports (old auth
--   shape); the roommate migration now DROPS + RECREATES those two so the
--   roommate shape always wins. This file is regenerated from the migrations.
--
-- WHAT THIS DOES (run ONCE, in the Supabase dashboard SQL Editor)
--   1. Drops ONLY the user schema `public` and the `supabase_migrations`
--      tracking schema -> clean slate for your tables.
--   2. Recreates the full RentMate schema from the five migration files, in order.
--   3. Grants anon + authenticated full access (RLS is disabled; this is a demo).
--
-- WHAT IT DOES NOT DO — read this before you panic about the dashboard:
--   * It NEVER touches system schemas: `storage`, `auth`, `realtime`,
--     `graphql_public`, `vault`, `extensions`. Those are protected; the cloud
--     dashboard will not even let you drop them, and this file does not try.
--   * It does NOT delete or "reset" the project. Your project URL, anon key,
--     storage buckets, auth settings and API config are all left exactly as they
--     are. You do NOT have to delete and re-create the project to run this.
--
-- It is idempotent in the only sense that matters: it always ends in the correct
-- schema, regardless of what the project held before.
-- =============================================================================

DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
COMMENT ON SCHEMA public IS 'standard public schema';

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;


-- ===================== 20260313120000_init_hk_rental_platform.sql =====================
-- HK Rental Platform — schema, RLS, storage (HK_Rental_Platform_Master_Cursor_Spec.md)

-- ---------------------------------------------------------------------------
-- Extensions & enums
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create type public.user_role as enum ('tenant', 'landlord', 'admin');
create type public.property_status as enum ('draft', 'active', 'rented', 'archived');
create type public.viewing_status as enum ('pending', 'approved', 'rejected', 'completed');
create type public.agreement_status as enum ('uploaded', 'processing', 'reviewed', 'failed');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.message_type as enum ('text', 'image', 'file');
create type public.risk_level as enum ('Low', 'Medium', 'High');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'tenant',
  language text not null default 'en' check (language in ('en', 'zh-HK')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);
create index profiles_role_idx on public.profiles (role);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Must exist after profiles table (function body references public.profiles)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Auto-create profile on signup (email from auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- properties (bilingual titles/descriptions per multi-language strategy)
-- ---------------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles (id) on delete restrict,
  title_en text not null,
  title_zh text,
  description_en text,
  description_zh text,
  district text not null,
  address text not null,
  monthly_rent numeric(12, 2) not null check (monthly_rent > 0),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  area_sqft numeric(10, 2) not null check (area_sqft > 0),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  property_type text not null,
  status public.property_status not null default 'draft',
  featured boolean not null default false,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_district_idx on public.properties (district);
create index properties_monthly_rent_idx on public.properties (monthly_rent);
create index properties_property_type_idx on public.properties (property_type);
create index properties_status_idx on public.properties (status);
create index properties_landlord_id_idx on public.properties (landlord_id);
create index properties_location_idx on public.properties (latitude, longitude);

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- property_images
-- ---------------------------------------------------------------------------
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index property_images_property_id_idx on public.property_images (property_id);

-- ---------------------------------------------------------------------------
-- amenities & property_amenities
-- ---------------------------------------------------------------------------
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_zh text not null,
  created_at timestamptz not null default now()
);

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  primary key (property_id, amenity_id)
);

-- ---------------------------------------------------------------------------
-- favourites
-- ---------------------------------------------------------------------------
create table public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create index favourites_user_id_idx on public.favourites (user_id);

-- ---------------------------------------------------------------------------
-- viewing_requests
-- ---------------------------------------------------------------------------
create table public.viewing_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  landlord_id uuid not null references public.profiles (id) on delete cascade,
  requested_time timestamptz not null,
  status public.viewing_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index viewing_requests_property_id_idx on public.viewing_requests (property_id);
create index viewing_requests_tenant_id_idx on public.viewing_requests (tenant_id);
create index viewing_requests_landlord_id_idx on public.viewing_requests (landlord_id);

create trigger viewing_requests_updated_at
  before update on public.viewing_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversations & messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties (id) on delete set null,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  landlord_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (property_id, tenant_id, landlord_id)
);

create index conversations_tenant_id_idx on public.conversations (tenant_id);
create index conversations_landlord_id_idx on public.conversations (landlord_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  message_body text not null,
  message_type public.message_type not null default 'text',
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- Typing indicator (ephemeral; realtime-friendly)
create table public.typing_indicators (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_user_unread_idx on public.notifications (user_id) where (not read);

-- ---------------------------------------------------------------------------
-- agreements & reviews
-- ---------------------------------------------------------------------------
create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_url text not null,
  extracted_text text,
  status public.agreement_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agreements_user_id_idx on public.agreements (user_id);

create trigger agreements_updated_at
  before update on public.agreements
  for each row execute function public.set_updated_at();

create table public.agreement_reviews (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements (id) on delete cascade,
  risk_level public.risk_level not null,
  summary text not null,
  findings_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index agreement_reviews_agreement_id_idx on public.agreement_reviews (agreement_id);

-- ---------------------------------------------------------------------------
-- reports & analytics
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create table public.property_view_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index property_view_events_property_id_idx on public.property_view_events (property_id);

create table public.chatbot_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notification triggers (viewing status)
-- ---------------------------------------------------------------------------
create or replace function public.notify_viewing_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prop_title text;
  msg_title text;
  msg_body text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select coalesce(p.title_en, 'Property') into prop_title
  from public.properties p where p.id = new.property_id;

  if new.status = 'approved' then
    msg_title := 'Viewing approved';
    msg_body := 'Your viewing request for ' || prop_title || ' was approved.';
    insert into public.notifications (user_id, title, body, metadata)
    values (new.tenant_id, msg_title, msg_body, jsonb_build_object('viewing_id', new.id));
  elsif new.status = 'rejected' then
    msg_title := 'Viewing declined';
    msg_body := 'Your viewing request for ' || prop_title || ' was declined.';
    insert into public.notifications (user_id, title, body, metadata)
    values (new.tenant_id, msg_title, msg_body, jsonb_build_object('viewing_id', new.id));
  end if;

  return new;
end;
$$;

create trigger viewing_requests_notify
  after update of status on public.viewing_requests
  for each row execute function public.notify_viewing_status_change();

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  conv record;
begin
  select * into conv from public.conversations c where c.id = new.conversation_id;
  if conv.tenant_id = new.sender_id then
    recipient := conv.landlord_id;
  else
    recipient := conv.tenant_id;
  end if;

  insert into public.notifications (user_id, title, body, metadata)
  values (
    recipient,
    'New message',
    left(new.message_body, 120),
    jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id)
  );
  return new;
end;
$$;

create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- Increment property view counter (callable from Edge Function or RPC)
create or replace function public.record_property_view(p_property_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.properties set view_count = view_count + 1 where id = p_property_id;
  insert into public.property_view_events (property_id, viewer_id)
  values (p_property_id, auth.uid());
end;
$$;

grant execute on function public.record_property_view(uuid) to authenticated;
grant execute on function public.record_property_view(uuid) to anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;
alter table public.favourites enable row level security;
alter table public.viewing_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.typing_indicators enable row level security;
alter table public.notifications enable row level security;
alter table public.agreements enable row level security;
alter table public.agreement_reviews enable row level security;
alter table public.reports enable row level security;
alter table public.property_view_events enable row level security;
alter table public.chatbot_usage enable row level security;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- properties
create policy "properties_select_active_or_owner_or_admin"
  on public.properties for select
  using (
    status = 'active'
    or landlord_id = auth.uid()
    or public.is_admin()
  );

create policy "properties_insert_landlord"
  on public.properties for insert
  with check (
    auth.uid() = landlord_id
    and exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('landlord', 'admin')
    )
  );

create policy "properties_update_owner"
  on public.properties for update
  using (landlord_id = auth.uid() or public.is_admin())
  with check (landlord_id = auth.uid() or public.is_admin());

create policy "properties_delete_owner"
  on public.properties for delete
  using (landlord_id = auth.uid() or public.is_admin());

-- property_images (follow property ownership)
create policy "property_images_select"
  on public.property_images for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.status = 'active' or p.landlord_id = auth.uid() or public.is_admin())
    )
  );

create policy "property_images_mutate_owner"
  on public.property_images for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (p.landlord_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (p.landlord_id = auth.uid() or public.is_admin())
    )
  );

-- amenities (public read)
create policy "amenities_select_all"
  on public.amenities for select
  using (true);

create policy "amenities_admin_write"
  on public.amenities for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "property_amenities_select"
  on public.property_amenities for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.status = 'active' or p.landlord_id = auth.uid() or public.is_admin())
    )
  );

create policy "property_amenities_mutate_owner"
  on public.property_amenities for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (p.landlord_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (p.landlord_id = auth.uid() or public.is_admin())
    )
  );

-- favourites
create policy "favourites_own"
  on public.favourites for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- viewing_requests
create policy "viewings_select_participant"
  on public.viewing_requests for select
  using (
    tenant_id = auth.uid()
    or landlord_id = auth.uid()
    or public.is_admin()
  );

create policy "viewings_insert_tenant"
  on public.viewing_requests for insert
  with check (tenant_id = auth.uid());

create policy "viewings_update_participant"
  on public.viewing_requests for update
  using (tenant_id = auth.uid() or landlord_id = auth.uid() or public.is_admin())
  with check (tenant_id = auth.uid() or landlord_id = auth.uid() or public.is_admin());

-- conversations
create policy "conversations_participants"
  on public.conversations for select
  using (tenant_id = auth.uid() or landlord_id = auth.uid() or public.is_admin());

create policy "conversations_insert_participant"
  on public.conversations for insert
  with check (tenant_id = auth.uid() or landlord_id = auth.uid());

-- messages
create policy "messages_select_participant"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid() or public.is_admin())
    )
  );

create policy "messages_insert_sender"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );

create policy "messages_update_read_receipt"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );

-- typing_indicators
create policy "typing_participants"
  on public.typing_indicators for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid())
    )
  )
  with check (user_id = auth.uid());

-- notifications
create policy "notifications_own"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- agreements
create policy "agreements_own"
  on public.agreements for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- agreement_reviews
create policy "agreement_reviews_owner"
  on public.agreement_reviews for select
  using (
    exists (
      select 1 from public.agreements a
      where a.id = agreement_id and (a.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "agreement_reviews_admin_insert"
  on public.agreement_reviews for insert
  with check (public.is_admin());

-- reports
create policy "reports_insert_reporter"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "reports_select_own_or_admin"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_admin_update"
  on public.reports for update
  using (public.is_admin());

-- analytics tables
create policy "property_views_insert"
  on public.property_view_events for insert
  with check (true);

create policy "property_views_admin_select"
  on public.property_view_events for select
  using (public.is_admin());

create policy "chatbot_usage_insert"
  on public.chatbot_usage for insert
  with check (user_id is null or user_id = auth.uid());

create policy "chatbot_usage_admin_select"
  on public.chatbot_usage for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets & policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('agreements', 'agreements', false, 52428800, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']),
  ('chat-attachments', 'chat-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Storage policies live on the protected `storage` schema, which this one-shot
-- does NOT drop — so they survive every run. Drop before create, or a second run
-- fails with "policy already exists" (42710) and rolls the whole script back.
drop policy if exists "avatars_public_read"           on storage.objects;
drop policy if exists "avatars_owner_upload"          on storage.objects;
drop policy if exists "avatars_owner_update"          on storage.objects;
drop policy if exists "property_images_public_read"  on storage.objects;
drop policy if exists "property_images_landlord_upload" on storage.objects;
drop policy if exists "agreements_owner_all"          on storage.objects;
drop policy if exists "chat_attachments_participant"  on storage.objects;
drop policy if exists "chat_attachments_upload"       on storage.objects;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "property_images_public_read"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "property_images_landlord_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'property-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "agreements_owner_all"
  on storage.objects for all
  using (
    bucket_id = 'agreements'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'agreements'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "chat_attachments_participant"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "chat_attachments_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Realtime publication for chat & notifications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.typing_indicators;


-- ===================== 20260313120001_seed_amenities.sql =====================
-- Seed common HK rental amenities (bilingual)

insert into public.amenities (name_en, name_zh) values
  ('Air conditioning', '冷氣'),
  ('Wi-Fi included', '包 Wi-Fi'),
  ('Near MTR', '近港鐵'),
  ('Furnished', '連傢俬'),
  ('Pet friendly', '可養寵物'),
  ('Balcony', '露台'),
  ('Gym in building', '會所健身室'),
  ('24h security', '24 小時保安'),
  ('Elevator', '升降機'),
  ('Cooking allowed', '可煮食'),
  ('Separate bathroom', '獨立浴室'),
  ('Window in room', '房內有窗');


-- ===================== 20261013233000_roommate_matching.sql =====================
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
-- NOTE: the init migration (old auth schema) ALSO creates `public.messages`
-- with a *different* shape. `create table if not exists` would silently keep the
-- stale init table, so we drop it first. This is intentional and idempotent.
drop table if exists public.messages cascade;
create table public.messages (
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
-- Same reason as `messages`: the init migration creates `public.reports` with a
-- different shape. Drop before create so the roommate shape always wins.
drop table if exists public.reports cascade;
create table public.reports (
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


-- ===================== 20261014150000_rentmate_homes.sql =====================
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


-- ===================== 20261014173000_profile_display_fields.sql =====================
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



-- -----------------------------------------------------------------------------
-- Final grants: anon + authenticated get full access to every new object.
-- (Supabase's default privileges usually cover this, but we make it explicit so
--  the anon key the app ships can both read and write with RLS disabled.)
-- -----------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
