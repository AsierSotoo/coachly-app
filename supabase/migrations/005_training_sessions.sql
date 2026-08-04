-- Sesiones de entrenamiento
create table training_sessions (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid references teams(id) on delete cascade not null,
  season_id    uuid references seasons(id) on delete cascade not null,
  date         date not null,
  title        text,
  notes        text,
  duration_min integer,
  created_at   timestamptz default now()
);

alter table training_sessions enable row level security;

create policy "users manage own training sessions"
  on training_sessions for all
  using (
    team_id in (select id from teams where user_id = auth.uid())
  );
