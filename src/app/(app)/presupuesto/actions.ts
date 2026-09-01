"use server";

import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";
import type { Categoria } from "@/lib/types";

const CATS = new Set<string>([
  "ingresos", "rebajos", "gastos", "ahorros",
  "inversion", "jugar", "donativos", "formacion",
]);

export async function addBudgetItem(formData: FormData) {
  const { space, user, currency, supabase } = await getPersonalContext();

  const categoria = String(formData.get("categoria")) as Categoria;
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  const automatico = formData.get("automatico") != null;
  const recurrente = formData.get("recurrente") != null;
  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));

  if (!concepto || !mes || !anio) return;

  const { data: last } = await supabase
    .from("budget_items")
    .select("orden")
    .eq("space_id", space.id)
    .eq("categoria", categoria)
    .eq("mes", mes)
    .eq("anio", anio)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle<{ orden: number }>();

  const { error } = await supabase.from("budget_items").insert({
    space_id: space.id,
    categoria,
    concepto,
    monto,
    moneda,
    automatico,
    recurrente,
    orden: (last?.orden ?? -1) + 1,
    mes,
    anio,
    created_by: user.id,
  });
  if (error) console.error("addBudgetItem failed:", error.message);

  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function updateBudgetItem(formData: FormData) {
  const { space, currency, supabase } = await getPersonalContext();

  const id = String(formData.get("id"));
  const concepto = String(formData.get("concepto") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  const automatico = formData.get("automatico") != null;
  const recurrente = formData.get("recurrente") != null;

  if (!id || !concepto) return;

  const { error } = await supabase
    .from("budget_items")
    .update({ concepto, monto, moneda, automatico, recurrente })
    .eq("id", id)
    .eq("space_id", space.id);
  if (error) console.error("updateBudgetItem failed:", error.message);

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

/** Reordena / recategoriza líneas tras un arrastrar-y-soltar. Nunca lanza. */
export async function applyBudgetOrder(payload: {
  mes: number;
  anio: number;
  listas: Record<string, string[]>;
}): Promise<{ ok: boolean }> {
  try {
    const { space, supabase } = await getPersonalContext();
    const mes = Number(payload?.mes);
    const anio = Number(payload?.anio);
    if (!mes || !anio || !payload?.listas) return { ok: false };

    for (const [categoria, ids] of Object.entries(payload.listas)) {
      if (!CATS.has(categoria) || !Array.isArray(ids)) continue;
      for (let index = 0; index < ids.length; index++) {
        const id = ids[index];
        if (typeof id !== "string") continue;
        await supabase
          .from("budget_items")
          .update({ categoria, orden: index })
          .eq("id", id)
          .eq("space_id", space.id)
          .eq("mes", mes)
          .eq("anio", anio);
      }
    }

    revalidatePath("/presupuesto");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("applyBudgetOrder failed:", e);
    return { ok: false };
  }
}
