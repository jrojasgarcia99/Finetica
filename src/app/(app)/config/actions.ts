"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/data";

export async function updateConfig(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();

  const pctFields = [
    "meta_gastos",
    "meta_ahorro",
    "meta_inversion",
    "meta_jugar",
    "meta_donativos",
    "meta_formacion",
    "meta_deuda",
  ];

  const update: Record<string, number> = {};
  for (const f of pctFields) {
    const raw = formData.get(f);
    if (raw !== null) update[f] = Number(raw) / 100;
  }
  update.tipo_cambio = Number(formData.get("tipo_cambio") || household.tipo_cambio);
  update.meses_fondo_basico = Number(formData.get("meses_fondo_basico") || household.meses_fondo_basico);
  update.meses_fondo_ideal = Number(formData.get("meses_fondo_ideal") || household.meses_fondo_ideal);

  await supabase.from("households").update(update).eq("id", household.id);

  revalidatePath("/config");
  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
  revalidatePath("/fondo-emergencia");
}

export async function updateHouseholdName(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await supabase.from("households").update({ name }).eq("id", household.id);
  revalidatePath("/config");
}
