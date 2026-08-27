-- Añade formación táctica al partido y posición táctica a las apariciones.
-- ⚠️  EJECUTAR EN EL SQL EDITOR DE SUPABASE ANTES DE DESPLEGAR EL CÓDIGO.

alter table public.matches
  add column if not exists formation text;

alter table public.appearances
  add column if not exists pitch_position text;

-- Refresca la caché de PostgREST para que los nuevos campos sean visibles.
notify pgrst, 'reload schema';
