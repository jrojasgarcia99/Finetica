-- ============================================================================
-- Perfil del usuario: género, fecha de nacimiento y foto (avatar).
-- La edad de Patrimonio pasa a calcularse desde la fecha de nacimiento.
--
--   PASO A  columnas nuevas en personal_spaces
--   PASO B  quitar patrimonio_edad (correr DESPUÉS de desplegar el código nuevo)
--   PASO C  bucket de Storage 'avatars' + políticas
-- Correr en el SQL Editor de Supabase, un PASO por vez, EN ORDEN.
-- ============================================================================


-- PASO A ─ género / fecha de nacimiento / ruta del avatar ──────────────────
alter table personal_spaces
  add column if not exists genero text
    check (genero in ('masculino','femenino','otro','no_decir')),
  add column if not exists fecha_nacimiento date,
  add column if not exists avatar_path text;


-- PASO B ─ la edad manual de Patrimonio ya no se usa ──────────────────────
-- Correr SOLO después de desplegar el código que ya no la lee.
alter table personal_spaces drop column if exists patrimonio_edad;


-- PASO C ─ Storage: bucket 'avatars' (público) + políticas por usuario ─────
-- Alternativa: crearlo en el panel → Storage → New bucket → nombre 'avatars',
-- marcar "Public bucket". Igual hay que correr las políticas de abajo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  create policy "avatars publico lectura" on storage.objects
    for select using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "avatars subir propia" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "avatars actualizar propia" on storage.objects
    for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "avatars borrar propia" on storage.objects
    for delete to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
