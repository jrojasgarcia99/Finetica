-- ============================================================================
-- MIGRACIÓN · "un hogar comparte todo"  ->  "espacio personal + familiar opcional"
-- ============================================================================
-- Correr en el SQL Editor de Supabase, un PASO por vez, EN ORDEN.
--
--   PASOS 1-3 y 8  : solo esquema (seguros).
--   PASOS 4-7      : MUEVEN / CREAN datos.  Antes del PASO 4:
--                    Supabase -> Database -> Backups -> "Create backup".
--                    Corré 4, 5, 6 y 7 de corrido.
--   PASO 9         : limpieza — SOLO después de desplegar la app nueva y
--                    confirmar en producción que todos entran y ven sus datos.
--
-- Todos los pasos son re-ejecutables (idempotentes) salvo que se indique.
-- ============================================================================


-- ============================================================================
-- PASO 1  [esquema]  ·  Tabla del espacio personal + su RLS
-- ============================================================================
create extension if not exists "pgcrypto";

create table if not exists personal_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  salario_mensual numeric not null default 0,
  created_at timestamptz not null default now(),
  monedas_activas text[] not null default array['CRC']::text[],
  moneda_primaria text not null default 'CRC' check (moneda_primaria in ('CRC','USD')),
  tipo_cambio numeric not null default 0,
  meta_gastos numeric not null default 0.5,
  meta_ahorro numeric not null default 0.1,
  meta_inversion numeric not null default 0.1,
  meta_jugar numeric not null default 0.1,
  meta_donativos numeric not null default 0.1,
  meta_formacion numeric not null default 0.1,
  meta_deuda numeric not null default 0.15,
  meses_fondo_basico int not null default 3,
  meses_fondo_ideal int not null default 6,
  fondo_acumulado numeric not null default 0,
  pago_extra_base numeric not null default 0,
  patrimonio_edad int,
  constraint personal_spaces_monedas_activas_valid
    check (monedas_activas <@ array['CRC','USD'] and array_length(monedas_activas, 1) >= 1)
);

alter table personal_spaces enable row level security;

create or replace function owns_space(s_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from personal_spaces where id = s_id and owner_id = auth.uid());
$$;

do $$ begin
  create policy "own personal space - select" on personal_spaces for select using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own personal space - insert" on personal_spaces for insert with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own personal space - update" on personal_spaces for update using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own personal space - delete" on personal_spaces for delete using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;


-- ============================================================================
-- PASO 2  [esquema]  ·  Tablas del Presupuesto Familiar + RLS + RPCs
-- ============================================================================
create or replace function generate_invite_code()
returns text language sql as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

create table if not exists family_budgets (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  monedas_activas text[] not null default array['CRC']::text[],
  moneda_primaria text not null default 'CRC' check (moneda_primaria in ('CRC','USD')),
  tipo_cambio numeric not null default 0,
  constraint family_budgets_monedas_activas_valid
    check (monedas_activas <@ array['CRC','USD'] and array_length(monedas_activas, 1) >= 1)
);

create table if not exists family_budget_members (
  id uuid primary key default gen_random_uuid(),
  family_budget_id uuid not null references family_budgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (user_id),
  unique (family_budget_id, user_id)
);

create table if not exists family_budget_categories (
  id uuid primary key default gen_random_uuid(),
  family_budget_id uuid not null references family_budgets(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  unique (family_budget_id, nombre)
);

create table if not exists family_budget_items (
  id uuid primary key default gen_random_uuid(),
  family_budget_id uuid not null references family_budgets(id) on delete cascade,
  categoria text not null,
  concepto text not null,
  monto numeric not null default 0,
  moneda text not null default 'CRC' check (moneda in ('CRC','USD')),
  automatico boolean not null default false,
  mes int not null check (mes between 1 and 12),
  anio int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists family_budget_items_mes_idx
  on family_budget_items (family_budget_id, anio, mes);

alter table family_budgets           enable row level security;
alter table family_budget_members    enable row level security;
alter table family_budget_categories enable row level security;
alter table family_budget_items      enable row level security;

create or replace function is_family_member(fb_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from family_budget_members where family_budget_id = fb_id and user_id = auth.uid());
$$;

create or replace function family_budget_roster()
returns table (user_id uuid, display_name text, salario_mensual numeric, joined_at timestamptz)
language sql security definer set search_path = public as $$
  select m.user_id, coalesce(ps.display_name, ''), coalesce(ps.salario_mensual, 0), m.joined_at
  from family_budget_members m
  left join personal_spaces ps on ps.owner_id = m.user_id
  where m.family_budget_id = (
    select family_budget_id from family_budget_members where user_id = auth.uid() limit 1
  )
  order by m.joined_at;
$$;

do $$ begin
  create policy "family budget - select" on family_budgets for select using (is_family_member(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family budget - update" on family_budgets for update using (is_family_member(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family members - select" on family_budget_members for select using (is_family_member(family_budget_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family members - leave" on family_budget_members for delete using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family categories" on family_budget_categories for all
    using (is_family_member(family_budget_id)) with check (is_family_member(family_budget_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "family items" on family_budget_items for all
    using (is_family_member(family_budget_id)) with check (is_family_member(family_budget_id));
exception when duplicate_object then null; end $$;

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

create or replace function join_family_budget(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fb_id uuid; fb_primaria text; my_primaria text;
begin
  if exists (select 1 from family_budget_members where user_id = auth.uid()) then
    raise exception 'ALREADY_LINKED';
  end if;
  select id, moneda_primaria into fb_id, fb_primaria
    from family_budgets where invite_code = upper(join_family_budget.code);
  if fb_id is null then raise exception 'INVALID_CODE'; end if;
  select moneda_primaria into my_primaria from personal_spaces where owner_id = auth.uid();
  if coalesce(my_primaria,'CRC') <> coalesce(fb_primaria,'CRC') then
    raise exception 'CURRENCY_MISMATCH';
  end if;
  insert into family_budget_members (family_budget_id, user_id)
    values (fb_id, auth.uid()) on conflict (user_id) do nothing;
  return fb_id;
end;
$$;

create or replace function leave_family_budget()
returns void language plpgsql security definer set search_path = public as $$
declare fb uuid;
begin
  select family_budget_id into fb from family_budget_members where user_id = auth.uid();
  if fb is null then return; end if;
  delete from family_budget_members where user_id = auth.uid();
  if not exists (select 1 from family_budget_members where family_budget_id = fb) then
    delete from family_budgets where id = fb;
  end if;
end;
$$;


-- ============================================================================
-- PASO 3  [esquema]  ·  Columna space_id (nullable por ahora) en los 4 módulos
-- ============================================================================
alter table budget_items add column if not exists space_id uuid references personal_spaces(id) on delete cascade;
alter table activos      add column if not exists space_id uuid references personal_spaces(id) on delete cascade;
alter table pasivos      add column if not exists space_id uuid references personal_spaces(id) on delete cascade;
alter table deudas       add column if not exists space_id uuid references personal_spaces(id) on delete cascade;


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


-- ============================================================================
-- PASO 9  [esquema]  ·  Limpieza final.  APLICADO EN PRODUCCIÓN: 2026-09-01
-- ============================================================================
drop policy if exists "members can view their household"   on households;
drop policy if exists "members can update their household" on households;
drop policy if exists "members can view fellow members"    on household_members;
drop policy if exists "members can update their own row"   on household_members;

alter table budget_items drop column if exists household_id;
alter table activos      drop column if exists household_id;
alter table pasivos      drop column if exists household_id;
alter table deudas       drop column if exists household_id;

drop function if exists create_household(text, text);
drop function if exists join_household(text, text);
drop function if exists my_household_id();
drop function if exists is_household_member(uuid);

drop table if exists household_members cascade;
drop table if exists households cascade;
