-- DuyT Danang-Concierge Supabase hardening
-- Run this in Supabase SQL Editor AFTER adding SUPABASE_SERVICE_ROLE_KEY to .env.local.
-- The Next.js server route /api/concierge should be the only writer.

alter table public."AdminUser" enable row level security;
alter table public."Venue" enable row level security;
alter table public."VenueImage" enable row level security;
alter table public."VenueSpot" enable row level security;
alter table public."Customer" enable row level security;
alter table public."Booking" enable row level security;
alter table public."BookingContact" enable row level security;
alter table public."ActivityLog" enable row level security;

-- Public anon users should not read/write admin tables directly.
-- Admin actions go through the Next.js API using the service-role key.

drop policy if exists "deny anon adminuser" on public."AdminUser";
create policy "deny anon adminuser" on public."AdminUser" for all to anon using (false) with check (false);

drop policy if exists "deny anon customer" on public."Customer";
create policy "deny anon customer" on public."Customer" for all to anon using (false) with check (false);

drop policy if exists "deny anon booking" on public."Booking";
create policy "deny anon booking" on public."Booking" for all to anon using (false) with check (false);

drop policy if exists "deny anon bookingcontact" on public."BookingContact";
create policy "deny anon bookingcontact" on public."BookingContact" for all to anon using (false) with check (false);

drop policy if exists "deny anon activitylog" on public."ActivityLog";
create policy "deny anon activitylog" on public."ActivityLog" for all to anon using (false) with check (false);

-- If you want public venue browsing directly from Supabase later, use these read-only policies.
-- The current app still reads through /api/concierge, so these can also remain denied.

drop policy if exists "public read venues" on public."Venue";
create policy "public read venues" on public."Venue" for select to anon using (true);

drop policy if exists "public read venue images" on public."VenueImage";
create policy "public read venue images" on public."VenueImage" for select to anon using (true);

drop policy if exists "public read venue spots" on public."VenueSpot";
create policy "public read venue spots" on public."VenueSpot" for select to anon using (true);

-- Cloudflare / production request audit log.
-- The Next.js server writes here using SUPABASE_SERVICE_ROLE_KEY.
create table if not exists public."SecurityLog" (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  ip text,
  country text,
  "cfRay" text,
  "userAgent" text,
  referer text,
  language text,
  method text,
  path text,
  metadata jsonb default '{}'::jsonb,
  "createdAt" timestamptz not null default now()
);

alter table public."SecurityLog" enable row level security;

drop policy if exists "deny anon securitylog" on public."SecurityLog";
create policy "deny anon securitylog" on public."SecurityLog" for all to anon using (false) with check (false);

-- Site-wide production settings for DuyT homepage banner/video.
-- Admin API writes here with service role; anonymous users cannot modify settings.
create table if not exists public."SiteSetting" (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  "updatedAt" timestamptz not null default now()
);

alter table public."SiteSetting" enable row level security;

drop policy if exists "deny anon sitesetting write" on public."SiteSetting";
create policy "deny anon sitesetting write" on public."SiteSetting" for all to anon using (false) with check (false);

-- Interactive venue table map / zone booking system.
-- Run once before using the dashboard table-map editor.
create table if not exists public."VenueTableZone" (
  id text primary key,
  "venueId" text not null references public."Venue"(id) on delete cascade,
  name text not null,
  label text,
  description text,
  "minimumSpend" integer not null default 0,
  capacity integer not null default 1,
  color text not null default '#D6A85F',
  "sortOrder" integer not null default 1,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."VenueSpot" add column if not exists area text;
alter table public."VenueSpot" add column if not exists "zoneId" text references public."VenueTableZone"(id) on delete set null;
alter table public."VenueSpot" add column if not exists status text not null default 'AVAILABLE';
alter table public."VenueSpot" add column if not exists shape text not null default 'RECT';
alter table public."VenueSpot" add column if not exists "bookingMode" text not null default 'REQUEST';
alter table public."VenueSpot" add column if not exists x numeric not null default 20;
alter table public."VenueSpot" add column if not exists y numeric not null default 22;
alter table public."VenueSpot" add column if not exists width numeric not null default 8;
alter table public."VenueSpot" add column if not exists height numeric not null default 5;
alter table public."VenueSpot" add column if not exists rotation numeric not null default 0;
alter table public."VenueSpot" add column if not exists color text;
alter table public."VenueSpot" add column if not exists "sortOrder" integer not null default 1;
alter table public."VenueSpot" add column if not exists badge text not null default 'NONE';

alter table public."VenueTableZone" enable row level security;

drop policy if exists "public read venue table zones" on public."VenueTableZone";
create policy "public read venue table zones" on public."VenueTableZone" for select to anon using (true);

-- Custom venue floor-plan elements so every venue can have a different layout.
create table if not exists public."VenueMapElement" (
  id text primary key,
  "venueId" text not null references public."Venue"(id) on delete cascade,
  type text not null default 'CUSTOM',
  label text not null default 'Element',
  x numeric not null default 50,
  y numeric not null default 50,
  width numeric not null default 20,
  height numeric not null default 5,
  rotation numeric not null default 0,
  color text not null default '#D6A85F',
  "sortOrder" integer not null default 1,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."VenueMapElement" enable row level security;

drop policy if exists "public read venue map elements" on public."VenueMapElement";
create policy "public read venue map elements" on public."VenueMapElement" for select to anon using (true);

-- Floor-plan visual theme per venue: background, ratio, grid, texture.
create table if not exists public."VenueMapConfig" (
  "venueId" text primary key references public."Venue"(id) on delete cascade,
  style text not null default 'NIGHTCLUB',
  ratio text not null default 'PORTRAIT',
  "backgroundColor" text not null default '#070A12',
  "accentColor" text not null default '#D6A85F',
  "surfaceColor" text not null default '#111827',
  "gridColor" text not null default 'rgba(255,255,255,0.055)',
  texture text not null default 'GRID',
  "helperText" text,
  "showGrid" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."VenueMapConfig" enable row level security;

drop policy if exists "public read venue map config" on public."VenueMapConfig";
create policy "public read venue map config" on public."VenueMapConfig" for select to anon using (true);

-- Persistent admin notification history.
-- Admin dashboard and public booking flow write/read this only through Next.js API routes with service-role key.
create table if not exists public."AdminNotification" (
  id text primary key,
  "reservationId" text not null,
  title text not null,
  message text not null,
  "tableColor" text,
  "isRead" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "AdminNotification_createdAt_idx"
on public."AdminNotification" ("createdAt" desc);

create index if not exists "AdminNotification_reservationId_idx"
on public."AdminNotification" ("reservationId");

alter table public."AdminNotification" enable row level security;

drop policy if exists "deny anon admin notifications" on public."AdminNotification";
create policy "deny anon admin notifications" on public."AdminNotification" for all to anon using (false) with check (false);

-- Optional: Realtime refresh triggers for admin. Run this block if tables are not already in the realtime publication.
do $$
begin
  begin alter publication supabase_realtime add table public."Booking"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."BookingContact"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."Customer"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."Venue"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."VenueImage"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."VenueSpot"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."VenueTableZone"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."VenueMapElement"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."VenueMapConfig"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."SiteSetting"; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public."AdminNotification"; exception when duplicate_object then null; end;
end $$;
