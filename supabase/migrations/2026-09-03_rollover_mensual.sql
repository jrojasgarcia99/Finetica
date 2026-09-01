-- ============================================================================
-- Rollover mensual automático: copiar líneas recurrentes + aplicar el pago
-- real mensual a las deudas. Correr en el SQL Editor de Supabase, un PASO por
-- vez, EN ORDEN.
--
--   PASO 5 requiere activar la extensión pg_cron A MANO desde el panel:
--     Supabase → Database → Extensions → buscar "pg_cron" → Enable.
--
--   A partir del PASO 5 los saldos de las deudas se mueven solos cada mes
--   (contabilidad real, no solo proyección). Re-ejecutar es seguro:
--   `rollover_log` evita cobrar dos veces el mismo mes.
-- ============================================================================


-- PASO 1 ─ [esquema] bitácora del rollover ───────────────────────────────────
create table if not exists rollover_log (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('personal','family')),
  scope_id uuid not null,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  ran_at timestamptz not null default now(),
  unique (scope_type, scope_id, anio, mes)
);
alter table rollover_log enable row level security;
-- Sin políticas: solo la tocan funciones SECURITY DEFINER.


-- PASO 2 ─ [función] copiar las líneas recurrentes de un scope a un mes ───────
create or replace function rollover_recurring(
  p_scope_type text, p_scope_id uuid, p_anio int, p_mes int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  src_mes int; src_anio int;
  tgt_key int := p_anio * 12 + p_mes;
  src_key int;
begin
  if p_scope_type = 'personal' then
    if exists (select 1 from budget_items
               where space_id = p_scope_id and anio = p_anio and mes = p_mes) then
      return;
    end if;
    select mes, anio into src_mes, src_anio
      from budget_items where space_id = p_scope_id
      order by anio desc, mes desc limit 1;
    if src_mes is null then return; end if;
    src_key := src_anio * 12 + src_mes;
    if tgt_key < src_key then return; end if;             -- solo hacia adelante

    insert into budget_items
      (space_id, categoria, concepto, monto, moneda, automatico, recurrente, orden, mes, anio, created_by)
    select space_id, categoria, concepto, monto, moneda, automatico, true, orden, p_mes, p_anio, created_by
    from budget_items
    where space_id = p_scope_id and mes = src_mes and anio = src_anio and recurrente = true;

  elsif p_scope_type = 'family' then
    if exists (select 1 from family_budget_items
               where family_budget_id = p_scope_id and anio = p_anio and mes = p_mes) then
      return;
    end if;
    select mes, anio into src_mes, src_anio
      from family_budget_items where family_budget_id = p_scope_id
      order by anio desc, mes desc limit 1;
    if src_mes is null then return; end if;
    src_key := src_anio * 12 + src_mes;
    if tgt_key < src_key then return; end if;

    insert into family_budget_items
      (family_budget_id, categoria, concepto, monto, moneda, automatico, recurrente, orden, mes, anio, created_by)
    select family_budget_id, categoria, concepto, monto, moneda, automatico, true, orden, p_mes, p_anio, created_by
    from family_budget_items
    where family_budget_id = p_scope_id and mes = src_mes and anio = src_anio and recurrente = true;
  end if;
end;
$$;


-- PASO 3 ─ [función] pago REAL mensual de las deudas de un espacio personal ───
create or replace function rollover_debts(p_space_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_primaria text;
  v_tc numeric;
  v_extra numeric;
  d record;
  v_interes numeric;
  v_pool_debt numeric;   -- pool convertido a la moneda de la deuda actual
  v_aplicado numeric;
  ids uuid[] := '{}';    -- orden de prioridad (bola de nieve)
begin
  select moneda_primaria, coalesce(tipo_cambio, 0), coalesce(pago_extra_base, 0)
    into v_primaria, v_tc, v_extra
  from personal_spaces where id = p_space_id;
  if not found then return; end if;

  -- 1) interés mensual + cuota mínima, en orden de prioridad (saldo asc)
  for d in
    select id, saldo_actual, tasa_interes_anual, cuota_minima
    from deudas
    where space_id = p_space_id and estado = 'Activa' and saldo_actual > 0
    order by saldo_actual asc, created_at asc
  loop
    ids := array_append(ids, d.id);
    v_interes := d.saldo_actual * coalesce(d.tasa_interes_anual, 0) / 100.0 / 12.0;
    update deudas
      set saldo_actual = d.saldo_actual + v_interes - coalesce(d.cuota_minima, 0)
    where id = d.id;
  end loop;

  -- 2) las que quedaron en cero o negativo tras la cuota mínima → Pagada
  update deudas set saldo_actual = 0, estado = 'Pagada'
  where space_id = p_space_id and estado = 'Activa' and saldo_actual <= 0;

  -- 3) pago_extra_base en cascada por prioridad
  if v_extra > 0 and array_length(ids, 1) is not null then
    for d in
      select dd.id, dd.saldo_actual, dd.moneda
      from deudas dd
      join unnest(ids) with ordinality u(id, ord) on u.id = dd.id
      where dd.space_id = p_space_id and dd.estado = 'Activa' and dd.saldo_actual > 0
      order by u.ord
    loop
      exit when v_extra <= 0;
      -- extra está en la moneda primaria; convertir a la de la deuda si difiere
      if d.moneda = v_primaria or v_tc = 0 then
        v_pool_debt := v_extra;
      else
        v_pool_debt := v_extra / v_tc;   -- primaria -> secundaria
      end if;

      v_aplicado := least(v_pool_debt, d.saldo_actual);
      update deudas
        set saldo_actual = greatest(d.saldo_actual - v_aplicado, 0),
            estado = case when d.saldo_actual - v_aplicado <= 0 then 'Pagada' else 'Activa' end
      where id = d.id;

      -- descontar del pool en moneda primaria lo efectivamente aplicado
      if d.moneda = v_primaria or v_tc = 0 then
        v_extra := v_extra - v_aplicado;
      else
        v_extra := v_extra - (v_aplicado * v_tc);
      end if;
    end loop;
  end if;
end;
$$;


-- PASO 4 ─ [funciones] orquestador (cron) + acceso desde la app ──────────────
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
      perform rollover_debts(r.id);
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

-- Lo llama la app al abrir el presupuesto: copia recurrentes del espacio
-- personal del usuario Y de su presupuesto familiar. No toca deudas ni el log.
create or replace function rollover_for_me(p_anio int, p_mes int)
returns void
language plpgsql security definer set search_path = public as $$
declare v_space uuid; v_fb uuid;
begin
  select id into v_space from personal_spaces where owner_id = auth.uid();
  if v_space is not null then
    perform rollover_recurring('personal', v_space, p_anio, p_mes);
  end if;
  select family_budget_id into v_fb from family_budget_members where user_id = auth.uid();
  if v_fb is not null then
    perform rollover_recurring('family', v_fb, p_anio, p_mes);
  end if;
end;
$$;


-- PASO 5 ─ [cron] programar el rollover diario ──────────────────────────────
-- (Activá pg_cron primero: panel → Database → Extensions → pg_cron → Enable)
create extension if not exists pg_cron;

select cron.schedule(
  'finetica-monthly-rollover',
  '0 7 * * *',                                   -- todos los días 07:00 UTC (01:00 CR)
  $$ select public.run_monthly_rollover() $$
);

-- Aplicá el mes en curso ahora mismo:
select public.run_monthly_rollover();
