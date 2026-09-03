-- ============================================================================
-- Aporte al Presupuesto Familiar: fuente del "salario" para el reparto.
--   'disponible' (por defecto): el Ingreso Disponible del mes en su Presupuesto.
--   'fijo': el monto de personal_spaces.salario_mensual.
-- Correr en el SQL Editor de Supabase, EN ORDEN.
-- ============================================================================


-- PASO A ─ columna de fuente ───────────────────────────────────────────────
alter table personal_spaces
  add column if not exists salario_fuente text not null default 'disponible'
    check (salario_fuente in ('disponible','fijo'));


-- PASO B ─ el roster también expone la fuente ──────────────────────────────
create or replace function family_budget_roster()
returns table (user_id uuid, display_name text, salario_mensual numeric,
               salario_fuente text, joined_at timestamptz)
language sql security definer set search_path = public as $$
  select m.user_id,
         coalesce(ps.display_name, ''),
         coalesce(ps.salario_mensual, 0),
         coalesce(ps.salario_fuente, 'disponible'),
         m.joined_at
  from family_budget_members m
  left join personal_spaces ps on ps.owner_id = m.user_id
  where m.family_budget_id = (
    select family_budget_id from family_budget_members where user_id = auth.uid() limit 1
  )
  order by m.joined_at;
$$;


-- PASO C ─ Ingreso Disponible por miembro y por mes (SECURITY DEFINER) ─────
-- Suma de 'ingresos' menos 'rebajos' de cada miembro del familiar del que soy
-- parte, agrupado por (usuario, año, mes).
create or replace function family_member_disponible()
returns table (user_id uuid, anio int, mes int, disponible numeric)
language sql security definer set search_path = public as $$
  select m.user_id, bi.anio, bi.mes,
    coalesce(sum(bi.monto) filter (where bi.categoria = 'ingresos'), 0)
    - coalesce(sum(bi.monto) filter (where bi.categoria = 'rebajos'), 0)
  from family_budget_members m
  join personal_spaces ps on ps.owner_id = m.user_id
  join budget_items bi on bi.space_id = ps.id and bi.categoria in ('ingresos','rebajos')
  where m.family_budget_id = (
    select family_budget_id from family_budget_members where user_id = auth.uid() limit 1
  )
  group by m.user_id, bi.anio, bi.mes;
$$;
