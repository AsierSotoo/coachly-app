-- ============================================================
-- Coachly — migración 004
-- Escudo del equipo rival por partido
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

alter table public.matches
  add column if not exists rival_logo_url text;
