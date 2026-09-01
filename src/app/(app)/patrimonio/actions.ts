"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/data";

export async function addActivo(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const concepto = String(formData.get("concepto") || "").trim();
  const valor = Number(formData.get("valor") || 0);
  if (!concepto) return;
  await supabase.from("activos").insert({ household_id: household.id, concepto, valor });
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function deleteActivo(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("activos").delete().eq("id", id).eq("household_id", household.id);
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function addPasivo(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const concepto = String(formData.get("concepto") || "").trim();
  const valor = Number(formData.get("valor") || 0);
  if (!concepto) return;
  await supabase.from("pasivos").insert({ household_id: household.id, concepto, valor });
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function deletePasivo(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("pasivos").delete().eq("id", id).eq("household_id", household.id);
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function updateEdad(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const edad = Number(formData.get("edad") || 0);
  await supabase
    .from("households")
    .update({ patrimonio_edad: edad || null })
    .eq("id", household.id);
  revalidatePath("/patrimonio");
}
