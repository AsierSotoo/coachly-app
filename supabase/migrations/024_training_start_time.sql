-- Hora de inicio del entrenamiento (opcional)
alter table training_sessions
  add column if not exists start_time time default null;
