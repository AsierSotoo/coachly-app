create table if not exists match_availability (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  status text not null check (status in ('available', 'unavailable', 'doubt')),
  updated_at timestamptz default now(),
  unique (match_id, player_id)
);

alter table match_availability enable row level security;

create policy "coach can manage match_availability"
  on match_availability for all
  using (
    exists (
      select 1 from matches m
      join seasons s on s.id = m.season_id
      join teams t on t.id = s.team_id
      where m.id = match_availability.match_id
        and t.user_id = auth.uid()
    )
  );
