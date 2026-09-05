-- Arregla "Eliminar cuenta": varias columnas created_by referencian
-- auth.users(id) sin regla de borrado, así que Postgres RECHAZA el borrado
-- del usuario si alguna fila quedó con su id ahí (aunque esa fila se vaya a
-- borrar de todos modos por otra cascada, p. ej. via space_id). created_by es
-- solo un dato de auditoría (quién creó la fila) — perderlo (NULL) cuando se
-- borra a esa persona es lo correcto, igual que ya se hacía en
-- family_budgets.created_by.

alter table family_budget_items
  drop constraint if exists family_budget_items_created_by_fkey,
  add constraint family_budget_items_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table budget_items
  drop constraint if exists budget_items_created_by_fkey,
  add constraint budget_items_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table envelopes
  drop constraint if exists envelopes_created_by_fkey,
  add constraint envelopes_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table envelope_movements
  drop constraint if exists envelope_movements_created_by_fkey,
  add constraint envelope_movements_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;
