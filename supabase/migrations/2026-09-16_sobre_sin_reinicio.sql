-- ============================================================================
-- Sobres: "No reiniciar automáticamente". Nuevo por defecto al crear un sobre;
-- los sobres que ya existían siguen reiniciando como hasta ahora (la columna
-- nace en false para todos, sin cambiar su comportamiento actual).
-- Correr en el SQL Editor de Supabase, EN ORDEN.
-- ============================================================================

-- PASO 1 ─ columna ──────────────────────────────────────────────────────────
alter table envelopes
  add column if not exists sin_reinicio boolean not null default false;


-- PASO 2 ─ reset_due_envelopes respeta sin_reinicio ────────────────────────
create or replace function reset_due_envelopes()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Costa_Rica')::date;
begin
  update envelopes
    set ciclo_inicio = envelope_period_start(reinicio_dia, v_today)
  where sin_reinicio = false
    and ciclo_inicio < envelope_period_start(reinicio_dia, v_today);
end;
$$;
