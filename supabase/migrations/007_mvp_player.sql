-- Columna para jugadora del partido (MVP) en cada match
alter table matches add column if not exists mvp_player_id uuid references players(id) on delete set null;

-- notes por si no estaba ya
alter table matches add column if not exists notes text;
