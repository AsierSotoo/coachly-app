-- CORRECCIÓN DE SEGURIDAD: las políticas "públicas" de disponibilidad
-- deben aplicarse SOLO al rol 'anon' (página sin sesión).
-- Sin TO anon, también se aplican a usuarios autenticados de otros equipos.

-- Equipos
drop policy if exists "public_read_teams_for_availability" on teams;
create policy "public_read_teams_for_availability"
  on teams for select
  to anon
  using (availability_enabled = true);

-- Temporadas
drop policy if exists "public_read_seasons_for_availability" on seasons;
create policy "public_read_seasons_for_availability"
  on seasons for select
  to anon
  using (true);

-- Jugadoras
drop policy if exists "public_read_players_for_availability" on players;
create policy "public_read_players_for_availability"
  on players for select
  to anon
  using (active = true);

-- Partidos
drop policy if exists "public_read_matches_by_token" on matches;
create policy "public_read_matches_by_token"
  on matches for select
  to anon
  using (availability_token is not null);

-- Entrenamientos
drop policy if exists "public_read_training_sessions_by_token" on training_sessions;
create policy "public_read_training_sessions_by_token"
  on training_sessions for select
  to anon
  using (availability_token is not null);
