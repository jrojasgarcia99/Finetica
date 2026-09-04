-- ============================================================================
-- Asistente de IA integrado.
--   · Instrucciones/conocimiento personalizado por cuenta (texto libre).
--   · Conteo de mensajes por día, con tope, para acotar el costo.
-- Correr en el SQL Editor de Supabase, EN ORDEN.
-- ============================================================================


-- PASO 1 ─ Instrucciones personalizadas del asistente (por cuenta) ─────────
alter table personal_spaces
  add column if not exists asistente_instrucciones text;


-- PASO 2 ─ Conteo de mensajes por día ─────────────────────────────────────
create table if not exists assistant_usage (
  space_id uuid not null references personal_spaces(id) on delete cascade,
  dia date not null default (now() at time zone 'utc')::date,
  count int not null default 0,
  primary key (space_id, dia)
);

alter table assistant_usage enable row level security;

create policy "own assistant usage - select" on assistant_usage
  for select using (owns_space(space_id));

create index if not exists assistant_usage_space_idx
  on assistant_usage (space_id, dia);


-- PASO 3 ─ Incremento atómico con tope diario ─────────────────────────────
-- Devuelve el conteo del día YA incluyendo este mensaje. Si el día ya estaba
-- en el tope, devuelve p_limit + 1 y NO incrementa (el llamador rechaza).
create or replace function assistant_bump_usage(p_space_id uuid, p_limit int)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if not owns_space(p_space_id) then
    raise exception 'forbidden';
  end if;

  insert into assistant_usage (space_id, dia, count)
  values (p_space_id, (now() at time zone 'utc')::date, 0)
  on conflict (space_id, dia) do nothing;

  update assistant_usage
     set count = count + 1
   where space_id = p_space_id
     and dia = (now() at time zone 'utc')::date
     and count < p_limit
  returning count into v_count;

  if v_count is null then
    return p_limit + 1;
  end if;
  return v_count;
end;
$$;
