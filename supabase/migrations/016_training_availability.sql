-- Token público único por sesión de entrenamiento
alter table training_sessions
  add column if not exists availability_token uuid default gen_random_uuid() unique;

update training_sessions set availability_token = gen_random_uuid() where availability_token is null;

-- Tabla de disponibilidad para entrenamientos (análoga a match_availability)
create table if not exists training_availability (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references training_sessions(id) on delete cascade not null,
  player_id  uuid references players(id) on delete cascade not null,
  status     text not null check (status in ('available', 'unavailable', 'doubt')),
  updated_at timestamptz default now(),
  unique (session_id, player_id)
);

alter table training_availability enable row level security;

create policy "coach_manage_training_availability"
  on training_availability for all
  using (
    exists (
      select 1 from training_sessions ts
      join teams t on t.id = ts.team_id
      where ts.id = training_availability.session_id
        and t.user_id = auth.uid()
    )
  );

create policy "public_select_training_availability"
  on training_availability for select using (true);

create policy "public_insert_training_availability"
  on training_availability for insert with check (true);

create policy "public_update_training_availability"
  on training_availability for update using (true) with check (true);
