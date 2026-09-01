-- ============================================================================
-- Historial de pagos de deudas (interés vs capital por mes).
-- Correr en el SQL Editor de Supabase, PASO por PASO.
-- ============================================================================


-- PASO A ─ tabla de historial ───────────────────────────────────────────────
create table if not exists debt_payments (
  id uuid primary key default gen_random_uuid(),
  deuda_id uuid not null references deudas(id) on delete cascade,
  space_id uuid not null references personal_spaces(id) on delete cascade,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  interes numeric not null default 0,          -- interés del mes (moneda de la deuda)
  capital numeric not null default 0,          -- reducción de capital (cuota - interés + extra)
  extra_aplicado numeric not null default 0,   -- de `capital`, cuánto vino del pago_extra_base
  saldo_resultante numeric not null default 0,
  moneda text not null,
  created_at timestamptz not null default now(),
  unique (deuda_id, anio, mes)
);
alter table debt_payments enable row level security;

do $$ begin
  create policy "own debt payments" on debt_payments
    for select using (owns_space(space_id));
exception when duplicate_object then null; end $$;

create index if not exists debt_payments_space_idx on debt_payments (space_id, anio, mes);


-- PASO B ─ rollover_debts: aplica el mes Y registra el desglose ──────────────
create or replace function rollover_debts(p_space_id uuid, p_anio int, p_mes int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_primaria text;
  v_tc numeric;
  v_extra numeric;
  d record;
  v_interes numeric;
  v_saldo_nuevo numeric;
  v_pool_debt numeric;
  v_aplicado numeric;
  ids uuid[] := '{}';
begin
  select moneda_primaria, coalesce(tipo_cambio, 0), coalesce(pago_extra_base, 0)
    into v_primaria, v_tc, v_extra
  from personal_spaces where id = p_space_id;
  if not found then return; end if;

  -- Pase 1: interés + cuota mínima, en orden de prioridad (saldo convertido a la primaria)
  for d in
    select id, saldo_actual, tasa_interes_anual, cuota_minima, moneda
    from deudas
    where space_id = p_space_id and estado = 'Activa' and saldo_actual > 0
    order by (case when moneda = v_primaria or v_tc = 0
                   then saldo_actual else saldo_actual * v_tc end) asc,
             created_at asc
  loop
    ids := array_append(ids, d.id);
    v_interes := d.saldo_actual * coalesce(d.tasa_interes_anual, 0) / 100.0 / 12.0;
    v_saldo_nuevo := d.saldo_actual + v_interes - coalesce(d.cuota_minima, 0);

    update deudas set saldo_actual = v_saldo_nuevo where id = d.id;

    insert into debt_payments
      (deuda_id, space_id, anio, mes, interes, capital, extra_aplicado, saldo_resultante, moneda)
    values
      (d.id, p_space_id, p_anio, p_mes, v_interes,
       coalesce(d.cuota_minima, 0) - v_interes, 0, greatest(v_saldo_nuevo, 0), d.moneda)
    on conflict (deuda_id, anio, mes) do update set
      interes = excluded.interes,
      capital = excluded.capital,
      extra_aplicado = 0,
      saldo_resultante = excluded.saldo_resultante,
      moneda = excluded.moneda;
  end loop;

  update deudas set saldo_actual = 0, estado = 'Pagada'
  where space_id = p_space_id and estado = 'Activa' and saldo_actual <= 0;

  update debt_payments set saldo_resultante = 0
  where space_id = p_space_id and anio = p_anio and mes = p_mes
    and deuda_id in (select id from deudas where estado = 'Pagada');

  -- Pase 2: pago_extra_base en cascada por prioridad
  if v_extra > 0 and array_length(ids, 1) is not null then
    for d in
      select dd.id, dd.saldo_actual, dd.moneda
      from deudas dd
      join unnest(ids) with ordinality u(id, ord) on u.id = dd.id
      where dd.space_id = p_space_id and dd.estado = 'Activa' and dd.saldo_actual > 0
      order by u.ord
    loop
      exit when v_extra <= 0;

      if d.moneda = v_primaria or v_tc = 0 then
        v_pool_debt := v_extra;
      else
        v_pool_debt := v_extra / v_tc;   -- primaria -> secundaria
      end if;

      v_aplicado := least(v_pool_debt, d.saldo_actual);
      v_saldo_nuevo := d.saldo_actual - v_aplicado;

      update deudas set saldo_actual = greatest(v_saldo_nuevo, 0) where id = d.id;
      if v_saldo_nuevo <= 0 then
        update deudas set estado = 'Pagada' where id = d.id;
      end if;

      update debt_payments set
        capital = capital + v_aplicado,
        extra_aplicado = v_aplicado,
        saldo_resultante = greatest(v_saldo_nuevo, 0)
      where deuda_id = d.id and anio = p_anio and mes = p_mes;

      if d.moneda = v_primaria or v_tc = 0 then
        v_extra := v_extra - v_aplicado;
      else
        v_extra := v_extra - (v_aplicado * v_tc);
      end if;
    end loop;
  end if;
end;
$$;


-- PASO B.2 ─ run_monthly_rollover pasa el año/mes a rollover_debts ───────────
create or replace function run_monthly_rollover(p_anio int default null, p_mes int default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  y int := coalesce(p_anio, extract(year  from (now() at time zone 'America/Costa_Rica'))::int);
  m int := coalesce(p_mes,  extract(month from (now() at time zone 'America/Costa_Rica'))::int);
  r record;
begin
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

-- La versión vieja rollover_debts(uuid) queda huérfana; se puede borrar:
drop function if exists rollover_debts(uuid);
