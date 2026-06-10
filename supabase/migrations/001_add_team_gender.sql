-- Añadir campo género al equipo
alter table public.teams
  add column if not exists gender text check (gender in ('Masculino', 'Femenino', 'Mixto'));
