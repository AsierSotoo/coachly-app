-- Posición del equipo en la clasificación de la liga
-- El entrenador lo introduce manualmente después de cada jornada
alter table seasons add column if not exists league_position int;
alter table seasons add column if not exists league_total_teams int;
