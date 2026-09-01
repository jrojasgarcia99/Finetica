"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/data";
import type { Categoria } from "@/lib/types";

export async function addBudgetItem(formData: FormData) {
  const { household, user } = await getHouseholdContext();
  const supabase = await createClient();

  const categoria = String(formData.get("categoria")) as Categoria;
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));

  if (!concepto || !mes || !anio) return;

  await supabase.from("budget_items").insert({
    household_id: household.id,
    categoria,
    concepto,
    monto,
    mes,
    anio,
    created_by: user.id,
  });

  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function deleteBudgetItem(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("budget_items").delete().eq("id", id).eq("household_id", household.id);

  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}
