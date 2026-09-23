-- Plantilla de jugadas ensayadas por temporada + asignaciones por partido
alter table seasons add column if not exists tactics_template jsonb default null;
alter table matches  add column if not exists tactics          jsonb default null;
