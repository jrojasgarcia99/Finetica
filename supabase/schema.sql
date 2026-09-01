-- ============================================================================
-- Finéfica · Presupuesto — esquema de base de datos (Supabase / Postgres)
-- ============================================================================
-- Cómo usar este archivo:
--   1. Crea un proyecto nuevo en https://supabase.com (plan gratuito).
--   2. Ve a "SQL Editor" -> "New query".
--   3. Pega TODO este archivo y haz clic en "Run".
-- Eso crea las tablas, activa seguridad a nivel de fila (RLS) y crea las
-- funciones que la aplicación usa para crear/unirse a un hogar.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- HOGARES (household) — el "libro" compartido. Cada persona pertenece a uno.
-- ----------------------------------------------------------------------------
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now(),

  -- Configuración / Metas (equivalente a la hoja "Config" del Excel)
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

  -- Fondo de Libertad Financiera
  fondo_acumulado numeric not null default 0,

  -- Plan de deudas (Bola de Nieve)
  pago_extra_base numeric not null default 0,

  -- Patrimonio Neto — Posición Patrimonial (PAR/MAR/SAR)
  patrimonio_edad int
);

-- ----------------------------------------------------------------------------
-- MIEMBROS DEL HOGAR — vincula cada cuenta (auth.users) a un hogar.
-- ----------------------------------------------------------------------------
create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  salario_mensual numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- ----------------------------------------------------------------------------
-- PARTIDAS DEL PRESUPUESTO — líneas mensuales por categoría
-- (Ingresos, Rebajos, Gastos, Ahorros, Inversión, Jugar, Donativos, Formación)
-- ----------------------------------------------------------------------------
create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  categoria text not null check (categoria in
    ('ingresos','rebajos','gastos','ahorros','inversion','jugar','donativos','formacion')),
  concepto text not null,
  monto numeric not null default 0,
  mes int not null check (mes between 1 and 12),
  anio int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists budget_items_household_mes_idx
  on budget_items (household_id, anio, mes);

-- ----------------------------------------------------------------------------
-- PATRIMONIO — Activos y Pasivos (además de las deudas, ver tabla `deudas`)
-- ----------------------------------------------------------------------------
create table if not exists activos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  concepto text not null,
  valor numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pasivos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  concepto text not null,
  valor numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DEUDAS — Plan Bola de Nieve
-- ----------------------------------------------------------------------------
create table if not exists deudas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  nombre text not null,
  institucion text,
  monto_original numeric not null default 0,
  saldo_actual numeric not null default 0,
  tasa_interes_anual numeric not null default 0,
  cuota_minima numeric not null default 0,
  fecha_inicio date,
  estado text not null default 'Activa' check (estado in ('Activa','Pagada')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SEGURIDAD (Row Level Security) — cada quien solo ve/edita el/los hogares
-- a los que pertenece.
-- ============================================================================

alter table households enable row level security;
alter table household_members enable row level security;
alter table budget_items enable row level security;
alter table activos enable row level security;
alter table pasivos enable row level security;
alter table deudas enable row level security;

create or replace function is_household_member(hh_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hh_id and user_id = auth.uid()
  );
$$;

create policy "members can view their household"
  on households for select
  using (is_household_member(id));

create policy "members can update their household"
  on households for update
  using (is_household_member(id));

create policy "members can view fellow members"
  on household_members for select
  using (is_household_member(household_id));

create policy "members can update their own row"
  on household_members for update
  using (user_id = auth.uid());

create policy "members can manage budget items"
  on budget_items for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members can manage activos"
  on activos for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members can manage pasivos"
  on pasivos for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members can manage deudas"
  on deudas for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- ============================================================================
-- FUNCIONES: crear hogar / unirse a hogar por código de invitación
-- (SECURITY DEFINER: se ejecutan con privilegios elevados de forma controlada,
--  para poder crear el hogar y la membresía en un solo paso atómico)
-- ============================================================================

create or replace function generate_invite_code()
returns text
language sql
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

create or replace function create_household(hh_name text, member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  code text;
begin
  code := generate_invite_code();
  insert into households (name, invite_code) values (hh_name, code)
    returning id into new_id;
  insert into household_members (household_id, user_id, display_name)
    values (new_id, auth.uid(), member_name);
  return new_id;
end;
$$;

create or replace function join_household(code text, member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hh_id uuid;
begin
  select id into hh_id from households where invite_code = upper(code);
  if hh_id is null then
    raise exception 'INVALID_CODE';
  end if;
  insert into household_members (household_id, user_id, display_name)
    values (hh_id, auth.uid(), member_name)
    on conflict (household_id, user_id) do update set display_name = excluded.display_name;
  return hh_id;
end;
$$;

create or replace function my_household_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid() limit 1;
$$;
