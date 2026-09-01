-- ============================================================================
-- Idioma por cuenta · flag "recurrente" · orden manual de líneas
-- Correr en el SQL Editor de Supabase, un PASO por vez. Todos son aditivos y
-- seguros; el PASO 4 solo llena la columna nueva `orden`.
-- ============================================================================

-- PASO 1 — idioma de la interfaz por cuenta
alter table personal_spaces
  add column if not exists idioma text not null default 'es'
  check (idioma in ('es','en'));

-- PASO 2 — flag "recurrente" (independiente de "automatico")
alter table budget_items
  add column if not exists recurrente boolean not null default false;
alter table family_budget_items
  add column if not exists recurrente boolean not null default false;

-- PASO 3 — orden manual de cada línea dentro de su categoría/mes
alter table budget_items
  add column if not exists orden int not null default 0;
alter table family_budget_items
  add column if not exists orden int not null default 0;

-- PASO 4 — [toca datos: solo escribe la columna `orden`]
--          orden inicial = orden de creación dentro de (categoría, mes, año)
with r as (
  select id,
         row_number() over (
           partition by space_id, categoria, mes, anio
           order by created_at
         ) - 1 as rn
  from budget_items
)
update budget_items b set orden = r.rn from r where r.id = b.id;

with r as (
  select id,
         row_number() over (
           partition by family_budget_id, categoria, mes, anio
           order by created_at
         ) - 1 as rn
  from family_budget_items
)
update family_budget_items f set orden = r.rn from r where r.id = f.id;
