-- ============================================================================
-- Orden del menú a gusto del usuario.
-- Guarda un arreglo de rutas (p. ej. '{/sobres,/dashboard,/presupuesto,...}').
-- La primera ruta es la pantalla de inicio; las primeras 5 salen en la barra
-- inferior del teléfono. NULL = orden por defecto de la app.
-- Correr en el SQL Editor de Supabase.
-- ============================================================================

alter table personal_spaces add column if not exists nav_order text[];
