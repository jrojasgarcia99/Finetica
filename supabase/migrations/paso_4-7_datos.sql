
-- ============================================================================
-- PASO 4  ·  [MUEVE DATOS]  Un personal_spaces por cada (hogar, miembro)
--            Cada miembro adicional queda con SU copia de la config que hasta
--            ahora compartían.
-- ============================================================================
insert into personal_spaces (
  owner_id, display_name, salario_mensual,
  monedas_activas, moneda_primaria, tipo_cambio,
  meta_gastos, meta_ahorro, meta_inversion, meta_jugar, meta_donativos, meta_formacion, meta_deuda,
  meses_fondo_basico, meses_fondo_ideal, fondo_acumulado, pago_extra_base, patrimonio_edad
)
select
  hm.user_id,
  coalesce(hm.display_name, ''),
  coalesce(hm.salario_mensual, 0),
  coalesce(h.monedas_activas, array['CRC']::text[]),
  coalesce(h.moneda_primaria, 'CRC'),
  coalesce(h.tipo_cambio, 0),
  h.meta_gastos, h.meta_ahorro, h.meta_inversion, h.meta_jugar,
  h.meta_donativos, h.meta_formacion, h.meta_deuda,
  h.meses_fondo_basico, h.meses_fondo_ideal, h.fondo_acumulado, h.pago_extra_base, h.patrimonio_edad
from household_members hm
join households h on h.id = hm.household_id
on conflict (owner_id) do nothing;


-- ============================================================================
-- PASO 5  ·  [MUEVE DATOS]  budget_items -> espacio personal de QUIEN LA CREÓ
-- ============================================================================
-- 5a) líneas con autor que es (o era) miembro del hogar
update budget_items bi
set space_id = ps.id
from household_members hm
join personal_spaces ps on ps.owner_id = hm.user_id
where bi.space_id is null
  and hm.household_id = bi.household_id
  and hm.user_id = bi.created_by;

-- 5b) líneas sin autor (o autor que ya no figura como miembro) -> al DUEÑO del
--     hogar (primer miembro por created_at)
update budget_items bi
set space_id = ps.id
from (
  select distinct on (household_id) household_id, user_id
  from household_members
  order by household_id, created_at asc
) owner
join personal_spaces ps on ps.owner_id = owner.user_id
where bi.space_id is null
  and owner.household_id = bi.household_id;


-- ============================================================================
-- PASO 6  ·  [MUEVE DATOS]  activos / pasivos / deudas -> espacio del DUEÑO
--            del hogar. El resto de miembros arranca estos módulos en blanco.
-- ============================================================================
with owner as (
  select distinct on (household_id) household_id, user_id
  from household_members
  order by household_id, created_at asc
)
update activos a
set space_id = ps.id
from owner
join personal_spaces ps on ps.owner_id = owner.user_id
where a.space_id is null and owner.household_id = a.household_id;

with owner as (
  select distinct on (household_id) household_id, user_id
  from household_members
  order by household_id, created_at asc
)
update pasivos p
set space_id = ps.id
from owner
join personal_spaces ps on ps.owner_id = owner.user_id
where p.space_id is null and owner.household_id = p.household_id;

with owner as (
  select distinct on (household_id) household_id, user_id
  from household_members
  order by household_id, created_at asc
)
update deudas d
set space_id = ps.id
from owner
join personal_spaces ps on ps.owner_id = owner.user_id
where d.space_id is null and owner.household_id = d.household_id;


-- ============================================================================
-- PASO 7  ·  [MUEVE DATOS]  Recrear el vínculo: cada hogar que HOY tiene más de
--            un miembro pasa a ser un Presupuesto Familiar con esos mismos
--            miembros. Los hogares de 1 sola persona NO generan familiar.
-- ============================================================================
do $$
declare h record; new_fb uuid;
begin
  for h in
    select hm.household_id, hh.monedas_activas, hh.moneda_primaria, hh.tipo_cambio
    from household_members hm
    join households hh on hh.id = hm.household_id
    group by hm.household_id, hh.monedas_activas, hh.moneda_primaria, hh.tipo_cambio
    having count(*) > 1
  loop
    -- si este hogar ya se migró (re-ejecución), saltar
    if exists (
      select 1
      from family_budget_members fbm
      join household_members hm2 on hm2.user_id = fbm.user_id
      where hm2.household_id = h.household_id
    ) then
      continue;
    end if;

    insert into family_budgets (invite_code, created_by, monedas_activas, moneda_primaria, tipo_cambio)
    values (
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
      (select user_id from household_members where household_id = h.household_id order by created_at asc limit 1),
      coalesce(h.monedas_activas, array['CRC']::text[]),
      coalesce(h.moneda_primaria, 'CRC'),
      coalesce(h.tipo_cambio, 0)
    )
    returning id into new_fb;

    insert into family_budget_members (family_budget_id, user_id)
    select new_fb, hm.user_id
    from household_members hm
    where hm.household_id = h.household_id
    on conflict (user_id) do nothing;

    insert into family_budget_categories (family_budget_id, nombre, orden) values
      (new_fb,'Vivienda',1),(new_fb,'Servicios Públicos',2),(new_fb,'Supermercado',3),
      (new_fb,'Transporte del Hogar',4),(new_fb,'Mantenimiento',5),
      (new_fb,'Seguros del Hogar',6),(new_fb,'Otros',7);
  end loop;
end $$;
