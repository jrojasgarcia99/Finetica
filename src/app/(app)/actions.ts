"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPersonalContext } from "@/lib/data";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Actualiza el tipo de cambio del ESPACIO PERSONAL desde el widget fijo
 * (esquina superior derecha). El Presupuesto Familiar tiene el suyo aparte.
 */
export async function updateTipoCambio(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const raw = Number(formData.get("tipo_cambio"));
  const tipo_cambio = Number.isFinite(raw) && raw >= 0 ? raw : space.tipo_cambio;
  await supabase.from("personal_spaces").update({ tipo_cambio }).eq("id", space.id);
  revalidatePath("/", "layout");
}
