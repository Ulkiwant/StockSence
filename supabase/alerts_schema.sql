-- Run this in your Supabase SQL editor to create the alerts tables

create table if not exists public.alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  alert_type  text not null check (alert_type in ('signal_change', 'price_variation')),
  threshold   numeric,           -- only for price_variation (e.g. 5 = 5%)
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, ticker, alert_type)
);

create table if not exists public.alert_logs (
  id         uuid primary key default gen_random_uuid(),
  alert_id   uuid not null references public.alerts(id) on delete cascade,
  value      text not null,      -- last known signal or price
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.alerts    enable row level security;
alter table public.alert_logs enable row level security;

create policy "Users own their alerts"
  on public.alerts for all
  using (auth.uid() = user_id);

create policy "Users can read their alert logs"
  on public.alert_logs for select
  using (exists (
    select 1 from public.alerts a
    where a.id = alert_logs.alert_id and a.user_id = auth.uid()
  ));

create policy "Service role manages alert logs"
  on public.alert_logs for all
  using (auth.role() = 'service_role');
