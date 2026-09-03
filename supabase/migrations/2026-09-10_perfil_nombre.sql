-- ============================================================================
-- Perfil: nombre completo + profesión.
-- `display_name` sigue siendo el "nombre preferido" (el que se muestra en la app).
-- Correr en el SQL Editor de Supabase.
-- ============================================================================

alter table personal_spaces
  add column if not exists segundo_nombre text,   -- opcional
  add column if not exists apellidos text,
  add column if not exists profesion text;        -- una clave de la lista (ver PROFESIONES)
