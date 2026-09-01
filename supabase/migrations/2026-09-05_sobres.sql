-- ============================================================================
-- Módulo "Sobres" (envelope budgeting).
-- Correr en el SQL Editor de Supabase, un PASO por vez, EN ORDEN.
--
--   PASO A  métodos de pago (por cuenta)
--   PASO B  sobres
--   PASO C  movimientos de sobre
--   PASO D  funciones de reinicio de período
--   PASO E  enganchar el reinicio al cron diario ya existente
-- ============================================================================


-- PASO A ─ métodos de pago, por cuenta de usuario ───────────────────────────
create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, nombre)
);
alter table payment_methods enable row level security;

do $$ begin
  create policy "own payment methods" on payment_methods
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

create index if not exists payment_methods_user_idx on payment_methods (user_id, orden);


-- PASO B ─ sobres ──────────────────────────────────────────────────────────
create table if not exists envelopes (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('personal','family')),
  space_id uuid references personal_spaces(id) on delete cascade,
  family_budget_id uuid references family_budgets(id) on delete cascade,
  nombre text not null,
  categoria text not null,                  -- personal: una de las 8 categorías; family: nombre de categoría familiar
  moneda text not null check (moneda in ('CRC','USD')),
  limite_mensual numeric not null default 0,
  icono text not null default 'Wallet',
  reinicio_dia int check (reinicio_dia between 1 and 31),   -- null = fin de mes calendario
  ciclo_inicio date not null default current_date,
  orden int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (
    (scope_type = 'personal' and space_id is not null and family_budget_id is null)
    or (scope_type = 'family' and family_budget_id is not null and space_id is null)
  )
);
alter table envelopes enable row level security;

do $$ begin
  create policy "envelopes access" on envelopes
    for all using (
      (scope_type = 'personal' and owns_space(space_id))
      or (scope_type = 'family' and is_family_member(family_budget_id))
    )
    with check (
      (scope_type = 'personal' and owns_space(space_id))
      or (scope_type = 'family' and is_family_member(family_budget_id))
    );
exception when duplicate_object then null; end $$;

create index if not exists envelopes_space_idx on envelopes (space_id);
create index if not exists envelopes_family_idx on envelopes (family_budget_id);


-- PASO C ─ movimientos dentro de un sobre ──────────────────────────────────
create table if not exists envelope_movements (
  id uuid primary key default gen_random_uuid(),
  envelope_id uuid not null references envelopes(id) on delete cascade,
  tipo text not null check (tipo in ('income','expense')),
  descripcion text not null,
  monto numeric not null default 0,
  moneda text not null check (moneda in ('CRC','USD')),
  fecha date not null default current_date,
  metodo_pago text,
  created_by uuid references auth.users(id),
  budget_item_id uuid references budget_items(id) on delete set null,
  family_budget_item_id uuid references family_budget_items(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table envelope_movements enable row level security;

do $$ begin
  create policy "envelope movements access" on envelope_movements
    for all using (
      exists (
        select 1 from envelopes e
        where e.id = envelope_id and (
          (e.scope_type = 'personal' and owns_space(e.space_id))
          or (e.scope_type = 'family' and is_family_member(e.family_budget_id))
        )
      )
    )
    with check (
      exists (
        select 1 from envelopes e
        where e.id = envelope_id and (
          (e.scope_type = 'personal' and owns_space(e.space_id))
          or (e.scope_type = 'family' and is_family_member(e.family_budget_id))
        )
      )
    );
exception when duplicate_object then null; end $$;

create index if not exists envelope_movements_env_idx on envelope_movements (envelope_id, fecha desc);


-- PASO D ─ inicio del período vigente + reinicio masivo ────────────────────
-- Dado el día de reinicio (null = fin de mes) y una fecha, devuelve la fecha
-- de arranque del período que contiene a esa fecha.
create or replace function envelope_period_start(p_dia int, p_hoy date)
returns date language plpgsql immutable as $$
declare
  v_ms date := date_trunc('month', p_hoy)::date;
  v_dim int;
  v_anchor date;
  v_pms date;
  v_dimp int;
begin
  if p_dia is null then
    return v_ms;
  end if;
  v_dim := extract(day from (v_ms + interval '1 month - 1 day'))::int;
  v_anchor := v_ms + ((least(p_dia, v_dim) - 1) || ' days')::interval;
  if p_hoy >= v_anchor then
    return v_anchor;
  end if;
  v_pms := (v_ms - interval '1 month')::date;
  v_dimp := extract(day from (v_pms + interval '1 month - 1 day'))::int;
  return (v_pms + ((least(p_dia, v_dimp) - 1) || ' days')::interval)::date;
end;
$$;

-- Avanza ciclo_inicio de cada sobre al período vigente. Idempotente; tolera
-- días sin correr (servidor caído).
create or replace function reset_due_envelopes()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Costa_Rica')::date;
begin
  update envelopes
    set ciclo_inicio = envelope_period_start(reinicio_dia, v_today)
  where ciclo_inicio < envelope_period_start(reinicio_dia, v_today);
end;
$$;


-- PASO E ─ run_monthly_rollover llama también a reset_due_envelopes ─────────
create or replace function run_monthly_rollover(p_anio int default null, p_mes int default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  y int := coalesce(p_anio, extract(year  from (now() at time zone 'America/Costa_Rica'))::int);
  m int := coalesce(p_mes,  extract(month from (now() at time zone 'America/Costa_Rica'))::int);
  r record;
begin
  perform reset_due_envelopes();

  for r in select id from personal_spaces loop
    if not exists (select 1 from rollover_log
                   where scope_type = 'personal' and scope_id = r.id and anio = y and mes = m) then
      perform rollover_recurring('personal', r.id, y, m);
      perform rollover_debts(r.id, y, m);
      insert into rollover_log (scope_type, scope_id, anio, mes)
        values ('personal', r.id, y, m) on conflict do nothing;
    end if;
  end loop;

  for r in select id from family_budgets loop
    if not exists (select 1 from rollover_log
                   where scope_type = 'family' and scope_id = r.id and anio = y and mes = m) then
      perform rollover_recurring('family', r.id, y, m);
      insert into rollover_log (scope_type, scope_id, anio, mes)
        values ('family', r.id, y, m) on conflict do nothing;
    end if;
  end loop;
end;
$$;
