-- Índices en FK para queries frecuentes (PostgreSQL no los crea automáticamente en la referencing side)
create index if not exists idx_appearances_match_id   on public.appearances(match_id);
create index if not exists idx_appearances_player_id  on public.appearances(player_id);
create index if not exists idx_matches_season_id      on public.matches(season_id);
create index if not exists idx_players_team_id        on public.players(team_id);
create index if not exists idx_seasons_team_id        on public.seasons(team_id);
create index if not exists idx_training_sessions_team_id   on public.training_sessions(team_id);
create index if not exists idx_training_sessions_season_id on public.training_sessions(season_id);
create index if not exists idx_training_attendance_session on public.training_attendance(session_id);
create index if not exists idx_training_attendance_player  on public.training_attendance(player_id);
create index if not exists idx_convocatorias_match_id      on public.convocatorias(match_id);
create index if not exists idx_convocatoria_players_player on public.convocatoria_players(player_id);
create index if not exists idx_match_availability_match    on public.match_availability(match_id);
