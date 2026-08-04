create table training_attendance (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references training_sessions(id) on delete cascade not null,
  player_id       uuid references players(id) on delete cascade not null,
  attended        boolean not null default true,
  absence_reason  text,
  created_at      timestamptz default now(),
  unique(session_id, player_id)
);

alter table training_attendance enable row level security;

create policy "users manage own training attendance"
  on training_attendance for all
  using (
    session_id in (
      select ts.id from training_sessions ts
      join teams t on t.id = ts.team_id
      where t.user_id = auth.uid()
    )
  );
