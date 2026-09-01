-- Corrige nombres de categoría mal codificados por el portapapeles ("P├║blicos").
-- Idempotente: si ya están bien, no hace nada.

update family_budget_categories
set nombre = 'Servicios Públicos'
where nombre like 'Servicios P%blicos' and nombre <> 'Servicios Públicos';

update family_budget_items
set categoria = 'Servicios Públicos'
where categoria like 'Servicios P%blicos' and categoria <> 'Servicios Públicos';

-- Recrear la función con la codificación correcta (la versión instalada quedó
-- con el nombre mal escrito para presupuestos familiares nuevos).
create or replace function create_family_budget()
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; code text; cfg record;
begin
  if exists (select 1 from family_budget_members where user_id = auth.uid()) then
    raise exception 'ALREADY_LINKED';
  end if;
  select monedas_activas, moneda_primaria, tipo_cambio into cfg
    from personal_spaces where owner_id = auth.uid();
  code := generate_invite_code();
  insert into family_budgets (invite_code, created_by, monedas_activas, moneda_primaria, tipo_cambio)
    values (code, auth.uid(),
            coalesce(cfg.monedas_activas, array['CRC']::text[]),
            coalesce(cfg.moneda_primaria, 'CRC'),
            coalesce(cfg.tipo_cambio, 0))
    returning id into new_id;
  insert into family_budget_members (family_budget_id, user_id) values (new_id, auth.uid());
  insert into family_budget_categories (family_budget_id, nombre, orden) values
    (new_id,'Vivienda',1),(new_id,'Servicios Públicos',2),(new_id,'Supermercado',3),
    (new_id,'Transporte del Hogar',4),(new_id,'Mantenimiento',5),
    (new_id,'Seguros del Hogar',6),(new_id,'Otros',7);
  return new_id;
end;
$$;
