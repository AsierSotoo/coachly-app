-- Seguimiento de ciclos de sanción por tarjetas amarillas
-- Cada vez que el entrenador confirma que la sanción fue cumplida, este contador sube 1
-- Las amarillas "efectivas" = total_yellows - (cycles_served * 4)
alter table players add column if not exists yellow_card_cycles_served int not null default 0;
