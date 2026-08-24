-- Añade estado al partido: 'scheduled' (programado) | 'finished' (finalizado)
-- Los partidos existentes quedan como 'finished' (no cambia nada)
-- Los nuevos partidos creados desde el calendario empiezan como 'scheduled'
alter table matches add column if not exists status text not null default 'finished';
