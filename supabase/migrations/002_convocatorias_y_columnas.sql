-- ============================================================
-- Coachly — migración 002
-- Añade columnas de foto/logo/bio y tablas de convocatorias
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ── Columnas añadidas a tablas existentes ───────────────────

alter table public.users
  add column if not exists avatar_url text;

alter table public.teams
  add column if not exists logo_url text;

alter table public.players
  add column if not exists photo_url text,
  add column if not exists bio       text;

-- ── Tablas de convocatorias ─────────────────────────────────

create table if not exists public.convocatorias (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.seasons(id) on delete cascade,
  match_id   uuid references public.matches(id) on delete set null,
  opponent   text not null,
  played_at  date not null,
  created_at timestamptz default now()
);

create table if not exists public.convocatoria_players (
  id                uuid primary key default gen_random_uuid(),
  convocatoria_id   uuid not null references public.convocatorias(id) on delete cascade,
  player_id         uuid not null references public.players(id) on delete cascade,
  status            text not null check (status in ('titular', 'convocada', 'no_convocada')) default 'convocada',
  created_at        timestamptz default now(),
  unique (convocatoria_id, player_id)
);

-- ── RLS para convocatorias ──────────────────────────────────

alter table public.convocatorias       enable row level security;
alter table public.convocatoria_players enable row level security;

create policy "convocatorias: via own seasons"
  on public.convocatorias for all
  using (
    season_id in (
      select s.id from public.seasons s
      join public.teams t on t.id = s.team_id
      where t.user_id = auth.uid()
    )
  );

create policy "convocatoria_players: via own convocatorias"
  on public.convocatoria_players for all
  using (
    convocatoria_id in (
      select c.id from public.convocatorias c
      join public.seasons s on s.id = c.season_id
      join public.teams t on t.id = s.team_id
      where t.user_id = auth.uid()
    )
  );

-- ── Índices útiles ──────────────────────────────────────────

create index if not exists convocatorias_season_id_idx on public.convocatorias (season_id);
create index if not exists convocatorias_match_id_idx  on public.convocatorias (match_id);
create index if not exists conv_players_conv_id_idx    on public.convocatoria_players (convocatoria_id);
create index if not exists conv_players_player_id_idx  on public.convocatoria_players (player_id);
