-- ============================================================================
-- ENDURECIMIENTO DE SEGURIDAD — auditoría de RLS (2026-09-18)
-- ============================================================================
-- Alcance: personal_spaces, family_budgets, family_budget_members, budget_items,
-- activos, pasivos, deudas, payment_methods (y las funciones owns_space() /
-- is_family_member() de las que dependen budget_items/activos/pasivos/deudas/
-- envelopes/envelope_movements/debt_payments/assistant_usage/personal_budget_categories).
--
-- Nota de mapeo: el pedido original mencionaba tablas "households" y
-- "household_members" — esas tablas ya NO EXISTEN, fueron reemplazadas el
-- 2026-09-01 (migración personal_spaces_y_familiar) por personal_spaces
-- (espacio privado) y family_budgets/family_budget_members (Presupuesto
-- Familiar compartido, opcional). Esta auditoría aplica sobre esas tablas
-- actuales, que son el equivalente vigente.
--
-- Qué cambia: SOLO el texto de las políticas/funciones (rendimiento y
-- endurecimiento). Ninguna estructura de tabla, ningún comportamiento visible
-- para el usuario. No altera qué filas puede ver cada quien, solo cómo se
-- evalúa la condición.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) auth.uid() -> (select auth.uid())
--    Evita que Postgres reevalúe auth.uid() por cada fila; lo resuelve una
--    sola vez por consulta (InitPlan). Aprovechamos para fijar
--    search_path = '' en las dos funciones (antes 'public'), ya que las
--    estamos tocando de todas formas — igual de válido, más estricto.
-- ----------------------------------------------------------------------------
create or replace function owns_space(s_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  select exists (
    select 1 from public.personal_spaces
    where id = s_id and owner_id = (select auth.uid())
  );
$$;

create or replace function is_family_member(fb_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  select exists (
    select 1 from public.family_budget_members
    where family_budget_id = fb_id and user_id = (select auth.uid())
  );
$$;

-- personal_spaces: las 4 políticas comparaban auth.uid() directo.
drop policy if exists "own personal space - select" on personal_spaces;
create policy "own personal space - select" on personal_spaces
  for select using (owner_id = (select auth.uid()));

drop policy if exists "own personal space - insert" on personal_spaces;
create policy "own personal space - insert" on personal_spaces
  for insert with check (owner_id = (select auth.uid()));

drop policy if exists "own personal space - update" on personal_spaces;
create policy "own personal space - update" on personal_spaces
  for update using (owner_id = (select auth.uid()));

drop policy if exists "own personal space - delete" on personal_spaces;
create policy "own personal space - delete" on personal_spaces
  for delete using (owner_id = (select auth.uid()));

-- family_budget_members: la política "leave" también comparaba auth.uid() directo.
drop policy if exists "family members - leave" on family_budget_members;
create policy "family members - leave" on family_budget_members
  for delete using (user_id = (select auth.uid()));

-- payment_methods (módulo Sobres): mismo patrón.
drop policy if exists "own payment methods" on payment_methods;
create policy "own payment methods" on payment_methods
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- budget_items / activos / pasivos / deudas / envelopes / envelope_movements /
-- debt_payments / assistant_usage / personal_budget_categories ya llaman a
-- owns_space()/is_family_member() en vez de comparar auth.uid() directo en la
-- política misma — quedan cubiertas automáticamente por el fix de arriba, sin
-- tocar su texto.

-- ----------------------------------------------------------------------------
-- 2) Recursión entre políticas: auditada, sin hallazgos que corregir.
--    Ninguna política de personal_spaces, family_budgets,
--    family_budget_members, budget_items, activos, pasivos o deudas hace una
--    subconsulta directa hacia otra tabla protegida por RLS — todas pasan por
--    owns_space()/is_family_member(), que son SECURITY DEFINER (evitan RLS
--    recursivo por diseño). No se creó ninguna función nueva porque no hacía
--    falta.
--    Nota aparte (fuera de alcance, no se tocó): envelope_movements sí hace
--    una subconsulta EXISTS directa contra `envelopes` (con RLS propia) en
--    vez de pasar por una función — no es un ciclo (no vuelve a
--    envelope_movements), pero sí duplica la evaluación de RLS de envelopes.
--    Si se quiere optimizar en otra pasada, se puede envolver en una función
--    security definer como las demás.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 3) GRANTS: anon no debería tener ningún privilegio sobre datos financieros
--    — toda esta app requiere sesión iniciada (rol `authenticated`), no hay
--    ninguna pantalla ni RPC pensada para acceso anónimo sobre estas tablas.
--    Esto es una capa extra (defensa en profundidad): aunque RLS ya bloquea
--    el acceso de `anon` (auth.uid() es null para ese rol), quitar el GRANT
--    de tabla evita que un bug futuro en una política dependa únicamente de
--    RLS para protegerse.
-- ----------------------------------------------------------------------------
revoke all on table
  personal_spaces,
  family_budgets, family_budget_members, family_budget_categories, family_budget_items,
  budget_items, personal_budget_categories,
  activos, pasivos, deudas, debt_payments,
  payment_methods, envelopes, envelope_movements,
  assistant_usage, rollover_log
from anon;

-- ----------------------------------------------------------------------------
-- 4) Vistas (VIEWs): no hay ninguna definida sobre estas tablas en el
--    esquema actual — security_invoker no aplica (nada que cambiar).
-- ----------------------------------------------------------------------------
