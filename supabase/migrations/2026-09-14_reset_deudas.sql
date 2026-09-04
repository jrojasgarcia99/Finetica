-- ============================================================================
-- "Resetear deudas" en Configuración: el dueño del espacio necesita poder
-- borrar su propio historial de pagos de deuda.
-- Correr en el SQL Editor de Supabase.
-- ============================================================================

create policy "own debt payments - delete" on debt_payments
  for delete using (owns_space(space_id));
