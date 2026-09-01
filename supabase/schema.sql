-- ============================================================================
-- Finéfica · Presupuesto — esquema de base de datos (Supabase / Postgres)
-- ============================================================================
-- Modelo:
--   * personal_spaces  — 1 fila por cuenta. Espacio PRIVADO: perfil (nombre +
--     salario) y toda la configuración (monedas, metas, fondo, tipo de cambio).
--     Presupuesto, Patrimonio, Deudas y Fondo cuelgan de aquí (space_id) y solo
--     los ve/edita su dueño.
--   * family_budgets (+ members / categories / items) — Presupuesto Familiar
--     compartido OPCIONAL, con su propio código de invitación y su propia
--     configuración de monedas.
--
-- Instalación nueva: pega TODO este archivo en el SQL Editor y "Run".
-- (Para migrar una base que ya está en producción NO se usa este archivo: ver
--  los bloques incrementales que entrega el equipo.)
-- ============================================================================

create extension if not exists "pgcrypto";

create or replace function generate_invite_code()
returns text language sql as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- ----------------------------------------------------------------------------
-- ESPACIO PERSONAL — 1 por cuenta
-- ----------------------------------------------------------------------------
create table if not exists personal_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  salario_mensual numeric not null default 0,
  created_at timestamptz not null default now(),

  -- Monedas: por ahora Colones (CRC) y Dólares (USD).
  monedas_activas text[] not null default array['CRC']::text[],
  moneda_primaria text not null default 'CRC' check (moneda_primaria in ('CRC','USD')),
  -- Unidades de la moneda primaria por 1 unidad de la secundaria (₡ por $1 con
  -- primaria = CRC). Se edita desde el control fijo arriba a la derecha.
  tipo_cambio numeric not null default 0,

  -- Metas (% del ingreso disponible)
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
  idioma text not null default 'es' check (idioma in ('es','en')),

  constraint personal_spaces_monedas_activas_valid
    check (monedas_activas <@ array['CRC','USD'] and array_length(monedas_activas, 1) >= 1)
);

-- ----------------------------------------------------------------------------
-- PRESUPUESTO FAMILIAR (compartido, opcional)
-- ----------------------------------------------------------------------------
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
  unique (user_id),                       -- una cuenta = a lo sumo un familiar
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
  categoria text not null,                 -- nombre libre (normalmente una categoría)
  concepto text not null,
  monto numeric not null default 0,
  moneda text not null default 'CRC' check (moneda in ('CRC','USD')),
  automatico boolean not null default false,
  recurrente boolean not null default false,
  orden int not null default 0,
  mes int not null check (mes between 1 and 12),
  anio int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists family_budget_items_mes_idx
  on family_budget_items (family_budget_id, anio, mes);

-- ----------------------------------------------------------------------------
-- MÓDULOS PERSONALES — cuelgan de personal_spaces (space_id)
-- ----------------------------------------------------------------------------
create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references personal_spaces(id) on delete cascade,
  categoria text not null check (categoria in
    ('ingresos','rebajos','gastos','ahorros','inversion','jugar','donativos','formacion')),
  concepto text not null,
  monto numeric not null default 0,
  moneda text not null default 'CRC' check (moneda in ('CRC','USD')),
  automatico boolean not null default false,
  recurrente boolean not null default false,
  orden int not null default 0,
  mes int not null check (mes between 1 and 12),
  anio int not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists budget_items_space_mes_idx
  on budget_items (space_id, anio, mes);

create table if not exists activos (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references personal_spaces(id) on delete cascade,
  concepto text not null,
  valor numeric not null default 0,
  moneda text not null default 'CRC' check (moneda in ('CRC','USD')),
  created_at timestamptz not null default now()
);

create table if not exists pasivos (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references personal_spaces(id) on delete cascade,
  concepto text not null,
  valor numeric not null default 0,
  moneda text not null default 'CRC' check (moneda in ('CRC','USD')),
  created_at timestamptz not null default now()
);

create table if not exists deudas (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references personal_spaces(id) on delete cascade,
  nombre text not null,
  institucion text,
  monto_original numeric not null default 0,
  saldo_actual numeric not null default 0,
  tasa_interes_anual numeric not null default 0,
  cuota_minima numeric not null default 0,
  moneda text not null default 'CRC' check (moneda in ('CRC','USD')),
  fecha_inicio date,
  estado text not null default 'Activa' check (estado in ('Activa','Pagada')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SEGURIDAD (Row Level Security)
-- ============================================================================
alter table personal_spaces          enable row level security;
alter table family_budgets           enable row level security;
alter table family_budget_members    enable row level security;
alter table family_budget_categories enable row level security;
alter table family_budget_items      enable row level security;
alter table budget_items             enable row level security;
alter table activos                  enable row level security;
alter table pasivos                  enable row level security;
alter table deudas                   enable row level security;

create or replace function owns_space(s_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from personal_spaces where id = s_id and owner_id = auth.uid());
$$;

create or replace function is_family_member(fb_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from family_budget_members where family_budget_id = fb_id and user_id = auth.uid());
$$;

-- Nombres + salarios de los co-miembros (sus espacios personales son privados).
create or replace function family_budget_roster()
returns table (user_id uuid, display_name text, salario_mensual numeric, joined_at timestamptz)
language sql security definer set search_path = public as $$
  select m.user_id,
         coalesce(ps.display_name, ''),
         coalesce(ps.salario_mensual, 0),
         m.joined_at
  from family_budget_members m
  left join personal_spaces ps on ps.owner_id = m.user_id
  where m.family_budget_id = (
    select family_budget_id from family_budget_members where user_id = auth.uid() limit 1
  )
  order by m.joined_at;
$$;

-- personal_spaces: cada quien, el suyo
create policy "own personal space - select" on personal_spaces for select using (owner_id = auth.uid());
create policy "own personal space - insert" on personal_spaces for insert with check (owner_id = auth.uid());
create policy "own personal space - update" on personal_spaces for update using (owner_id = auth.uid());
create policy "own personal space - delete" on personal_spaces for delete using (owner_id = auth.uid());

-- módulos personales
create policy "own budget items" on budget_items for all
  using (owns_space(space_id)) with check (owns_space(space_id));
create policy "own activos" on activos for all
  using (owns_space(space_id)) with check (owns_space(space_id));
create policy "own pasivos" on pasivos for all
  using (owns_space(space_id)) with check (owns_space(space_id));
create policy "own deudas" on deudas for all
  using (owns_space(space_id)) with check (owns_space(space_id));

-- presupuesto familiar
create policy "family budget - select" on family_budgets for select using (is_family_member(id));
create policy "family budget - update" on family_budgets for update using (is_family_member(id));
create policy "family members - select" on family_budget_members for select using (is_family_member(family_budget_id));
create policy "family members - leave" on family_budget_members for delete using (user_id = auth.uid());
create policy "family categories" on family_budget_categories for all
  using (is_family_member(family_budget_id)) with check (is_family_member(family_budget_id));
create policy "family items" on family_budget_items for all
  using (is_family_member(family_budget_id)) with check (is_family_member(family_budget_id));

-- ============================================================================
-- RPCs del Presupuesto Familiar
-- ============================================================================
create or replace function create_family_budget()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  code text;
  cfg record;
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
    (new_id, 'Vivienda', 1),
    (new_id, 'Servicios Públicos', 2),
    (new_id, 'Supermercado', 3),
    (new_id, 'Transporte del Hogar', 4),
    (new_id, 'Mantenimiento', 5),
    (new_id, 'Seguros del Hogar', 6),
    (new_id, 'Otros', 7);
  return new_id;
end;
$$;

create or replace function join_family_budget(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  fb_id uuid;
  fb_primaria text;
  my_primaria text;
begin
  if exists (select 1 from family_budget_members where user_id = auth.uid()) then
    raise exception 'ALREADY_LINKED';
  end if;
  select id, moneda_primaria into fb_id, fb_primaria
    from family_budgets where invite_code = upper(join_family_budget.code);
  if fb_id is null then
    raise exception 'INVALID_CODE';
  end if;
  select moneda_primaria into my_primaria from personal_spaces where owner_id = auth.uid();
  if coalesce(my_primaria, 'CRC') <> coalesce(fb_primaria, 'CRC') then
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
    delete from family_budgets where id = fb;  -- cascade limpia categorías e items
  end if;
end;
$$;

-- ============================================================================
-- ROLLOVER MENSUAL — copia de líneas recurrentes + pago real de deudas
-- (ver supabase/migrations/2026-09-03_rollover_mensual.sql para los detalles)
-- ============================================================================
create table if not exists rollover_log (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('personal','family')),
  scope_id uuid not null,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  ran_at timestamptz not null default now(),
  unique (scope_type, scope_id, anio, mes)
);
alter table rollover_log enable row level security;  -- solo funciones SECURITY DEFINER

-- Historial de pagos de deudas (interés vs capital por mes) — lo escribe rollover_debts.
create table if not exists debt_payments (
  id uuid primary key default gen_random_uuid(),
  deuda_id uuid not null references deudas(id) on delete cascade,
  space_id uuid not null references personal_spaces(id) on delete cascade,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  interes numeric not null default 0,
  capital numeric not null default 0,
  extra_aplicado numeric not null default 0,
  saldo_resultante numeric not null default 0,
  moneda text not null,
  created_at timestamptz not null default now(),
  unique (deuda_id, anio, mes)
);
alter table debt_payments enable row level security;
create policy "own debt payments" on debt_payments for select using (owns_space(space_id));
create index if not exists debt_payments_space_idx on debt_payments (space_id, anio, mes);

-- rollover_recurring / rollover_debts(space,anio,mes) / run_monthly_rollover /
-- rollover_for_me: ver supabase/migrations/2026-09-03_* y 2026-09-04_*. En una
-- instalación nueva, pegá esos archivos tras este schema.

-- Cron (requiere activar la extensión pg_cron en el panel de Supabase):
--   create extension if not exists pg_cron;
--   select cron.schedule('finetica-monthly-rollover', '0 7 * * *',
--     $$ select public.run_monthly_rollover() $$);
