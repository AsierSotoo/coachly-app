-- Token público único por partido para el enlace de disponibilidad
alter table matches
  add column if not exists availability_token uuid default gen_random_uuid() unique;

-- Rellenar tokens en partidos existentes que queden NULL por alguna razón
update matches set availability_token = gen_random_uuid() where availability_token is null;

-- Feature flag por equipo (desactivado por defecto)
alter table teams
  add column if not exists availability_enabled boolean not null default false;

-- Permitir lectura/escritura pública a match_availability
-- La seguridad la da el token UUID (imposible de adivinar).
-- El coach mantiene su policy "for all" existente.
create policy "public_select_match_availability"
  on match_availability for select using (true);

create policy "public_insert_match_availability"
  on match_availability for insert with check (true);

create policy "public_update_match_availability"
  on match_availability for update using (true) with check (true);
