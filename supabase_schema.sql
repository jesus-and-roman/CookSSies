-- Schéma Supabase minimal pour le tracker raisonnable
-- À exécuter dans l'éditeur SQL de ton projet Supabase

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null,          -- pageview | click | time_on_page | scroll | heartbeat
  url text,
  path text,
  title text,
  referrer text,
  data jsonb default '{}'::jsonb,    -- device, browser, os, screen, language, timezone, click details, etc.
  ip_partial boolean default true,   -- true = on ne stocke jamais l'IP complète côté client
  created_at timestamptz not null default now()
);

-- Index utiles
create index if not exists idx_analytics_session on public.analytics_events (session_id);
create index if not exists idx_analytics_type on public.analytics_events (event_type);
create index if not exists idx_analytics_created on public.analytics_events (created_at desc);
create index if not exists idx_analytics_path on public.analytics_events (path);

-- RLS (Row Level Security) — recommandé
alter table public.analytics_events enable row level security;

-- Politique : tout le monde peut insérer (anon key), personne ne lit depuis le client
create policy "Allow anonymous insert"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

-- Lecture uniquement pour les rôles service / dashboard
create policy "Service role can read"
  on public.analytics_events
  for select
  to service_role
  using (true);

-- Optionnel : table sessions agrégées (à remplir via fonction ou cron si tu veux)
/*
create table if not exists public.analytics_sessions (
  session_id text primary key,
  first_seen timestamptz,
  last_seen timestamptz,
  pageviews int default 0,
  total_seconds int default 0,
  max_scroll int default 0,
  device_type text,
  browser text,
  os text,
  country text,          -- si tu ajoutes une Edge Function pour géoloc
  created_at timestamptz default now()
);
*/
