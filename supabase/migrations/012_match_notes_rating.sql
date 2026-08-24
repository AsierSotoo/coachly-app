-- Notas del entrenador por partido (el campo ya existía en el código, faltaba la columna)
alter table matches add column if not exists notes text;

-- Valoración del entrenador por jugadora (1-5 estrellas)
alter table appearances add column if not exists rating smallint check (rating >= 1 and rating <= 5);
