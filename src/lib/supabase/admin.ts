import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave `service_role` — solo para operaciones administrativas
 * que la sesión normal no puede hacer, como borrar la cuenta de auth.users
 * (borrar tu propia cuenta requiere el API de admin de Supabase). NUNCA usar
 * esto para leer/escribir datos de un usuario en el flujo normal — eso sigue
 * pasando por el cliente de sesión + RLS, sin saltarse nada.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_URL) en las variables de entorno.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
