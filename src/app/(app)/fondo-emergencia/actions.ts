"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/data";

export async function updateFondoAcumulado(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const fondo_acumulado = Number(formData.get("fondo_acumulado") || 0);
  await supabase.from("households").update({ fondo_acumulado }).eq("id", household.id);
  revalidatePath("/fondo-emergencia");
  revalidatePath("/dashboard");
}
