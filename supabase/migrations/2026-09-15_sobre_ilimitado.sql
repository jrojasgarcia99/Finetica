-- ============================================================================
-- Sobres: meta ilimitada (sin presupuesto tope). Al activarla, el sobre deja
-- de compararse contra un límite; se sigue registrando lo gastado.
-- Correr en el SQL Editor de Supabase.
-- ============================================================================

alter table envelopes
  add column if not exists limite_ilimitado boolean not null default false;
