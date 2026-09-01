"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getFamilyBudgetContext, type FamilyBudgetContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";

async function requireFamily(): Promise<FamilyBudgetContext> {
  const fam = await getFamilyBudgetContext();
  if (!fam) redirect("/familiar");
  return fam;
}

export async function addFamilyItem(formData: FormData) {
  const { familyBudget, currency, supabase, user } = await requireFamily();

  const categoria = String(formData.get("categoria") || "").trim();
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  const automatico = formData.get("automatico") != null;
  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));

  if (!categoria || !concepto || !mes || !anio) return;

  await supabase.from("family_budget_items").insert({
    family_budget_id: familyBudget.id,
    categoria,
    concepto,
    monto,
    moneda,
    automatico,
    mes,
    anio,
    created_by: user.id,
  });

  revalidatePath("/familiar");
}

export async function updateFamilyItem(formData: FormData) {
  const { familyBudget, currency, supabase } = await requireFamily();

  const id = String(formData.get("id"));
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  const automatico = formData.get("automatico") != null;

  if (!id || !concepto) return;

  await supabase
    .from("family_budget_items")
    .update({ concepto, monto, moneda, automatico })
    .eq("id", id)
    .eq("family_budget_id", familyBudget.id);

  revalidatePath("/familiar");
}

export async function deleteFamilyItem(formData: FormData) {
  const { familyBudget, supabase } = await requireFamily();
  const id = String(formData.get("id"));
  await supabase
    .from("family_budget_items")
    .delete()
    .eq("id", id)
    .eq("family_budget_id", familyBudget.id);
  revalidatePath("/familiar");
}

export async function addFamilyCategory(formData: FormData) {
  const { familyBudget, supabase } = await requireFamily();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;

  const { data: last } = await supabase
    .from("family_budget_categories")
    .select("orden")
    .eq("family_budget_id", familyBudget.id)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle<{ orden: number }>();

  await supabase.from("family_budget_categories").insert({
    family_budget_id: familyBudget.id,
    nombre,
    orden: (last?.orden ?? 0) + 1,
  });
  revalidatePath("/familiar");
}

export async function deleteFamilyCategory(formData: FormData) {
  const { familyBudget, supabase } = await requireFamily();
  const id = String(formData.get("id"));
  const nombre = String(formData.get("nombre") || "");

  // Borrar la categoría y también sus gastos (referencian el nombre, no el id).
  await supabase
    .from("family_budget_items")
    .delete()
    .eq("family_budget_id", familyBudget.id)
    .eq("categoria", nombre);
  await supabase
    .from("family_budget_categories")
    .delete()
    .eq("id", id)
    .eq("family_budget_id", familyBudget.id);

  revalidatePath("/familiar");
}

export async function updateFamilyTipoCambio(formData: FormData) {
  const { familyBudget, supabase } = await requireFamily();
  const raw = Number(formData.get("tipo_cambio"));
  const tipo_cambio = Number.isFinite(raw) && raw >= 0 ? raw : familyBudget.tipo_cambio;
  await supabase.from("family_budgets").update({ tipo_cambio }).eq("id", familyBudget.id);
  revalidatePath("/familiar");
}
