-- ============================================================================
-- Sobres ligados a una línea del presupuesto.
-- Un sobre ahora nace de una línea existente (budget_items / family_budget_items)
-- y hereda su nombre / monto / moneda. Los movimientos del sobre YA NO espejan
-- líneas de presupuesto: la línea de origen es la que cuenta.
-- Correr los dos pasos en el SQL Editor de Supabase, EN ORDEN.
-- ============================================================================


-- PASO A ─ el sobre referencia su línea de origen ──────────────────────────
alter table envelopes
  add column if not exists source_budget_item_id uuid
    references budget_items(id) on delete set null,
  add column if not exists source_family_budget_item_id uuid
    references family_budget_items(id) on delete set null;


-- PASO B ─ los movimientos ya no crean líneas de presupuesto ───────────────
alter table envelope_movements drop column if exists budget_item_id;
alter table envelope_movements drop column if exists family_budget_item_id;
