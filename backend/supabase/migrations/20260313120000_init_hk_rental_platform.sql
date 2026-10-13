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
