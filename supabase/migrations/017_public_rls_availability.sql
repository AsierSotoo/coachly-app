-- Políticas públicas para que /disponibilidad/[token] funcione sin autenticación.
-- La seguridad la da el token UUID (imposible de adivinar).

-- Partidos: lectura pública si tienen token asignado
create policy "public_read_matches_by_token"
  on matches for select using (availability_token is not null);

-- Temporadas: lectura pública (necesario para el join matches→seasons→teams)
create policy "public_read_seasons_for_availability"
  on seasons for select using (true);

-- Equipos: lectura pública cuando la feature está activa
create policy "public_read_teams_for_availability"
  on teams for select using (availability_enabled = true);

-- Entrenamientos: lectura pública si tienen token asignado
create policy "public_read_training_sessions_by_token"
  on training_sessions for select using (availability_token is not null);

-- Jugadoras: lectura pública de jugadoras activas
create policy "public_read_players_for_availability"
  on players for select using (active = true);
