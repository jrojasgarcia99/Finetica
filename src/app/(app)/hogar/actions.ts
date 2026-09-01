"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/data";

export async function updateMySalary(formData: FormData) {
  const { member } = await getHouseholdContext();
  const supabase = await createClient();
  const salario_mensual = Number(formData.get("salario_mensual") || 0);
  await supabase
    .from("household_members")
    .update({ salario_mensual })
    .eq("id", member.id);
  revalidatePath("/hogar");
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function updateMyName(formData: FormData) {
  const { member } = await getHouseholdContext();
  const supabase = await createClient();
  const display_name = String(formData.get("display_name") || "").trim();
  if (!display_name) return;
  await supabase.from("household_members").update({ display_name }).eq("id", member.id);
  revalidatePath("/hogar");
}
