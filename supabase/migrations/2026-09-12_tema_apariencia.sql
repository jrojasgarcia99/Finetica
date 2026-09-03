-- ============================================================================
-- Apariencia: tema de color asociado a la cuenta (además del claro/oscuro, que
-- sigue viviendo sólo en el navegador). Cada tema tiene su versión clara y
-- oscura; se elige en Configuración → Apariencia.
-- Correr en el SQL Editor de Supabase.
-- ============================================================================

alter table personal_spaces
  add column if not exists tema text not null default 'clasico'
    check (tema in ('clasico','rosa','lavanda','menta','cielo','arena'));
