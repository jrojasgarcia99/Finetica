"use server";

import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";

export async function updateFondoAcumulado(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const fondo_acumulado = Number(formData.get("fondo_acumulado") || 0);
  await supabase.from("personal_spaces").update({ fondo_acumulado }).eq("id", space.id);
  revalidatePath("/fondo-emergencia");
  revalidatePath("/dashboard");
}
