-- Goles recibidos para porteras y minuto de sustitución
alter table public.appearances
  add column if not exists goals_conceded smallint not null default 0,
  add column if not exists sub_minute smallint;
notify pgrst, 'reload schema';
