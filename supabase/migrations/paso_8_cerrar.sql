-- ============================================================================
-- PASO 8  [esquema]  ·  Cerrar los módulos personales
-- ============================================================================
-- 8a) VERIFICACIÓN — las 4 columnas deben dar 0. Si alguna no es 0, DETENERSE:
--     hay filas huérfanas (p. ej. de un usuario borrado). Revisar antes de
--     seguir. Consulta para ubicarlas:
--       select id, household_id, created_by from budget_items where space_id is null;
select
  (select count(*) from budget_items where space_id is null) as budget_items_sin_space,
  (select count(*) from activos      where space_id is null) as activos_sin_space,
  (select count(*) from pasivos      where space_id is null) as pasivos_sin_space,
  (select count(*) from deudas       where space_id is null) as deudas_sin_space;

-- 8b) Si la verificación dio todo 0, correr el resto del PASO 8:
alter table budget_items alter column space_id set not null;
alter table activos      alter column space_id set not null;
alter table pasivos      alter column space_id set not null;
alter table deudas       alter column space_id set not null;

drop policy if exists "members can manage budget items" on budget_items;
drop policy if exists "members can manage activos"      on activos;
drop policy if exists "members can manage pasivos"      on pasivos;
drop policy if exists "members can manage deudas"       on deudas;

do $$ begin
  create policy "own budget items" on budget_items for all using (owns_space(space_id)) with check (owns_space(space_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own activos" on activos for all using (owns_space(space_id)) with check (owns_space(space_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own pasivos" on pasivos for all using (owns_space(space_id)) with check (owns_space(space_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own deudas" on deudas for all using (owns_space(space_id)) with check (owns_space(space_id));
exception when duplicate_object then null; end $$;

-- >>> Aquí: DESPLEGAR la app nueva y verificar en producción. <<<
-- (Entre este punto y el despliegue, la app vieja deja de funcionar: correr
--  8b y desplegar en la misma ventana de mantenimiento.)
