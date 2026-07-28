-- DuyT Booking admin Web Push subscriptions.
-- Safe to run repeatedly in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public."AdminPushSubscription" (
  "id" uuid primary key default gen_random_uuid(),
  "adminId" text null,
  "endpoint" text not null,
  "p256dh" text not null,
  "auth" text not null,
  "expirationTime" bigint null,
  "deviceName" text null,
  "userAgent" text null,
  "isEnabled" boolean not null default true,
  "createdAt" timestamp with time zone not null default now(),
  "updatedAt" timestamp with time zone not null default now(),
  "lastSeenAt" timestamp with time zone not null default now(),
  constraint "AdminPushSubscription_endpoint_key" unique ("endpoint"),
  constraint "AdminPushSubscription_adminId_fkey"
    foreign key ("adminId") references public."AdminUser"("id")
    on update cascade on delete cascade
);

create index if not exists "AdminPushSubscription_adminId_idx"
  on public."AdminPushSubscription" ("adminId");
create index if not exists "AdminPushSubscription_isEnabled_idx"
  on public."AdminPushSubscription" ("isEnabled");
create index if not exists "AdminPushSubscription_lastSeenAt_idx"
  on public."AdminPushSubscription" ("lastSeenAt" desc);

create or replace function public."setAdminPushSubscriptionUpdatedAt"()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists "AdminPushSubscription_setUpdatedAt"
  on public."AdminPushSubscription";
create trigger "AdminPushSubscription_setUpdatedAt"
before update on public."AdminPushSubscription"
for each row execute function public."setAdminPushSubscriptionUpdatedAt"();

alter table public."AdminPushSubscription" enable row level security;
revoke all privileges on table public."AdminPushSubscription" from anon, authenticated;
grant select, insert, update, delete on table public."AdminPushSubscription" to service_role;
