-- ============================================================
-- Coachly — migración 003
-- Notas por partido + share token por temporada
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Notas libres en cada partido (análisis post-partido del entrenador)
alter table public.matches
  add column if not exists notes text;

-- Token público para compartir estadísticas de temporada (sin login)
alter table public.seasons
  add column if not exists share_token uuid default gen_random_uuid() unique;

-- Rellenar share_token en temporadas ya existentes que queden a NULL
update public.seasons
  set share_token = gen_random_uuid()
  where share_token is null;
