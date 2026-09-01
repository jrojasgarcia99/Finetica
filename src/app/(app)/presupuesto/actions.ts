"use server";

import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";
import type { Categoria } from "@/lib/types";

export async function addBudgetItem(formData: FormData) {
  const { space, user, currency, supabase } = await getPersonalContext();

  const categoria = String(formData.get("categoria")) as Categoria;
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const moneda = normalizarMoneda(
    formData.get("moneda"),
    currency.activas,
    currency.primaria,
  );
  const automatico = formData.get("automatico") != null;
  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));

  if (!concepto || !mes || !anio) return;

  await supabase.from("budget_items").insert({
    space_id: space.id,
    categoria,
    concepto,
    monto,
    moneda,
    automatico,
    mes,
    anio,
    created_by: user.id,
  });

  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function updateBudgetItem(formData: FormData) {
  const { space, currency, supabase } = await getPersonalContext();

  const id = String(formData.get("id"));
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const moneda = normalizarMoneda(
    formData.get("moneda"),
    currency.activas,
    currency.primaria,
  );
  const automatico = formData.get("automatico") != null;

  if (!id || !concepto) return;

  await supabase
    .from("budget_items")
    .update({ concepto, monto, moneda, automatico })
    .eq("id", id)
    .eq("space_id", space.id);

  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function deleteBudgetItem(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const id = String(formData.get("id"));

  await supabase.from("budget_items").delete().eq("id", id).eq("space_id", space.id);

  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}
