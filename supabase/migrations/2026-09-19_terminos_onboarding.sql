-- ============================================================================
-- Registro de aceptación de Términos/Privacidad en el onboarding (2026-09-19)
-- ============================================================================
-- Nueva columna para dejar constancia de cuándo cada cuenta aceptó los
-- Términos de Servicio y la Política de Privacidad. NULL para cuentas que
-- completaron el onboarding antes de este cambio (no se les pide de nuevo
-- retroactivamente).
-- ============================================================================
alter table personal_spaces
  add column if not exists terminos_aceptados_at timestamptz;
