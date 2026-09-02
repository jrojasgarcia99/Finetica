-- ============================================================================
-- Categorías del presupuesto personal editables.
-- Las 8 categorías fijas pasan a: Ingresos / Rebajos estructurales (en código)
-- + una lista editable por espacio (personal_budget_categories). Deuda sigue
-- derivada de la tabla `deudas`, con su meta en personal_spaces.meta_deuda.
--
-- Correr en el SQL Editor de Supabase, un PASO por vez, EN ORDEN.
--   PASO D borra columnas: correrlo DESPUÉS de desplegar el código nuevo.
-- ============================================================================


-- PASO A ─ tabla de categorías personales ──────────────────────────────────
create table if not exists personal_budget_categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references personal_spaces(id) on delete cascade,
  clave text not null,                         -- estable; lo guarda budget_items.categoria
  nombre text not null,                        -- visible, editable
  tipo text not null check (tipo in ('maximo','minimo')),
  meta numeric not null default 0,             -- fracción del ingreso disponible (0.30 = 30%)
  orden int not null default 0,
  created_at timestamptz not null default now(),
  unique (space_id, clave)
);
alter table personal_budget_categories enable row level security;

do $$ begin
  create policy "own personal categories" on personal_budget_categories
    for all using (owns_space(space_id)) with check (owns_space(space_id));
exception when duplicate_object then null; end $$;

create index if not exists personal_budget_categories_space_idx
  on personal_budget_categories (space_id, orden);


-- PASO B ─ sembrar las 6 categorías base con sus metas actuales ─────────────
do $$
declare s record;
begin
  for s in select * from personal_spaces loop
    insert into personal_budget_categories (space_id, clave, nombre, tipo, meta, orden) values
      (s.id, 'gastos',    case when s.idioma = 'en' then 'Expenses'   else 'Gastos'    end, 'maximo', coalesce(s.meta_gastos, 0.5),    1),
      (s.id, 'ahorros',   case when s.idioma = 'en' then 'Savings'    else 'Ahorros'   end, 'minimo', coalesce(s.meta_ahorro, 0.1),    2),
      (s.id, 'inversion', case when s.idioma = 'en' then 'Investment' else 'Inversión' end, 'minimo', coalesce(s.meta_inversion, 0.1), 3),
      (s.id, 'jugar',     case when s.idioma = 'en' then 'Play'       else 'Jugar'     end, 'maximo', coalesce(s.meta_jugar, 0.1),     4),
      (s.id, 'donativos', case when s.idioma = 'en' then 'Donations'  else 'Donativos' end, 'minimo', coalesce(s.meta_donativos, 0.1), 5),
      (s.id, 'formacion', case when s.idioma = 'en' then 'Education'   else 'Formación' end, 'minimo', coalesce(s.meta_formacion, 0.1), 6)
    on conflict (space_id, clave) do nothing;
  end loop;
end $$;


-- PASO C ─ budget_items.categoria pasa a texto libre (una `clave`) ─────────
alter table budget_items drop constraint if exists budget_items_categoria_check;


-- PASO D ─ quitar las columnas meta_* de personal_spaces (meta_deuda queda) ─
-- Correr SOLO después de desplegar el código que ya no las lee.
alter table personal_spaces
  drop column if exists meta_gastos,
  drop column if exists meta_ahorro,
  drop column if exists meta_inversion,
  drop column if exists meta_jugar,
  drop column if exists meta_donativos,
  drop column if exists meta_formacion;
