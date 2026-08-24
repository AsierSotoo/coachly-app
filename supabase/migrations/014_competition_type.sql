alter table matches
  add column if not exists competition_type text not null default 'liga'
  check (competition_type in ('liga', 'copa', 'amistoso'));
