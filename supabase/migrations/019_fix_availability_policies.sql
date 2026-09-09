-- CORRECCIÓN: las políticas públicas de match_availability y training_availability
-- tampoco tenían TO anon → cualquier usuario autenticado podía leer/escribir datos ajenos.
--
-- Las escrituras van EXCLUSIVAMENTE por el server action (admin client que bypasea RLS),
-- así que las policies de INSERT/UPDATE anon no son necesarias: se eliminan.
-- Solo se mantiene SELECT TO anon para que la página pública pueda leer los estados actuales.

-- match_availability
drop policy if exists "public_select_match_availability"  on match_availability;
drop policy if exists "public_insert_match_availability"  on match_availability;
drop policy if exists "public_update_match_availability"  on match_availability;

create policy "public_select_match_availability"
  on match_availability for select
  to anon
  using (true);

-- training_availability
drop policy if exists "public_select_training_availability" on training_availability;
drop policy if exists "public_insert_training_availability" on training_availability;
drop policy if exists "public_update_training_availability" on training_availability;

create policy "public_select_training_availability"
  on training_availability for select
  to anon
  using (true);
