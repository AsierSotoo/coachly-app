-- ============================================================
-- Coachly — esquema completo con RLS
-- Pegar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Tablas -------------------------------------------------------

create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text,
  avatar_url text,
  created_at timestamptz default now()
);

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  category   text,
  gender     text check (gender in ('Masculino', 'Femenino', 'Mixto')),
  logo_url   text,
  created_at timestamptz default now()
);

create table public.players (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  number     int,
  position   text,
  active     bool default true,
  photo_url  text,
  bio        text,
  created_at timestamptz default now()
);

create table public.seasons (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references public.seasons(id) on delete cascade,
  opponent       text not null,
  played_at      date not null,
  home           bool default true,
  competition    text,
  goals_for      int default 0,
  goals_against  int default 0,
  created_at     timestamptz default now()
);

create table public.appearances (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  player_id    uuid not null references public.players(id) on delete cascade,
  starter      bool default false,
  minutes      int default 0,
  goals        int default 0,
  assists      int default 0,
  yellow_cards int default 0,
  red_cards    int default 0,
  shots        int,
  saves        int,
  unique (match_id, player_id)
);

-- Trigger: crear perfil de usuario al registrarse ---------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security -------------------------------------------

alter table public.users       enable row level security;
alter table public.teams       enable row level security;
alter table public.players     enable row level security;
alter table public.seasons     enable row level security;
alter table public.matches     enable row level security;
alter table public.appearances enable row level security;

-- users: cada entrenador solo ve y edita su propia fila
create policy "users: own row"
  on public.users for all
  using (id = auth.uid());

-- teams: solo los equipos del entrenador autenticado
create policy "teams: own teams"
  on public.teams for all
  using (user_id = auth.uid());

-- players: solo jugadoras de equipos propios
create policy "players: via own teams"
  on public.players for all
  using (
    team_id in (
      select id from public.teams where user_id = auth.uid()
    )
  );

-- seasons: solo temporadas de equipos propios
create policy "seasons: via own teams"
  on public.seasons for all
  using (
    team_id in (
      select id from public.teams where user_id = auth.uid()
    )
  );

-- matches: solo partidos de temporadas de equipos propios
create policy "matches: via own seasons"
  on public.matches for all
  using (
    season_id in (
      select s.id from public.seasons s
      join public.teams t on t.id = s.team_id
      where t.user_id = auth.uid()
    )
  );

-- appearances: solo participaciones de partidos propios
create policy "appearances: via own matches"
  on public.appearances for all
  using (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.teams t on t.id = s.team_id
      where t.user_id = auth.uid()
    )
  );

-- Convocatorias ------------------------------------------------

create table public.convocatorias (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.seasons(id) on delete cascade,
  match_id   uuid references public.matches(id) on delete set null,
  opponent   text not null,
  played_at  date not null,
  created_at timestamptz default now()
);

create table public.convocatoria_players (
  id                uuid primary key default gen_random_uuid(),
  convocatoria_id   uuid not null references public.convocatorias(id) on delete cascade,
  player_id         uuid not null references public.players(id) on delete cascade,
  status            text not null check (status in ('titular', 'convocada', 'no_convocada')) default 'convocada',
  created_at        timestamptz default now(),
  unique (convocatoria_id, player_id)
);

alter table public.convocatorias        enable row level security;
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

create index convocatorias_season_id_idx on public.convocatorias (season_id);
create index convocatorias_match_id_idx  on public.convocatorias (match_id);
create index conv_players_conv_id_idx    on public.convocatoria_players (convocatoria_id);
create index conv_players_player_id_idx  on public.convocatoria_players (player_id);
