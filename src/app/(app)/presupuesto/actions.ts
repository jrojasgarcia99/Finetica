"use server";

import { revalidatePath } from "next/cache";
import { getPersonalContext, DEFAULT_PERSONAL_CATEGORIES } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";
import { CATEGORIA_ESTRUCTURALES } from "@/lib/types";
import type { Categoria } from "@/lib/types";

const ESTRUCTURALES = new Set<string>(CATEGORIA_ESTRUCTURALES);

function revalidateBudget() {
  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/fondo-emergencia");
}

/** Devuelve el set de `clave` válidas del espacio (estructurales + categorías). */
async function clavesValidas(
  supabase: Awaited<ReturnType<typeof getPersonalContext>>["supabase"],
  spaceId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("personal_budget_categories")
    .select("clave")
    .eq("space_id", spaceId);
  return new Set<string>([...ESTRUCTURALES, ...(data ?? []).map((c) => c.clave as string)]);
}

function slugify(s: string): string {
  // NFD + quitar todo lo que no sea a-z0-9 también elimina los diacríticos.
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "cat"
  );
}

// --- Líneas del presupuesto --------------------------------------------

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
  if (!(await clavesValidas(supabase, space.id)).has(categoria)) return;

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

  revalidateBudget();
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

  revalidateBudget();
}

export async function deleteBudgetItem(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const id = String(formData.get("id"));
  await supabase.from("budget_items").delete().eq("id", id).eq("space_id", space.id);
  revalidateBudget();
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

    const validas = await clavesValidas(supabase, space.id);

    for (const [categoria, ids] of Object.entries(payload.listas)) {
      if (!validas.has(categoria) || !Array.isArray(ids)) continue;
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

    revalidateBudget();
    return { ok: true };
  } catch (e) {
    console.error("applyBudgetOrder failed:", e);
    return { ok: false };
  }
}

// --- Categorías personales -------------------------------------------

export async function addPersonalCategory(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const nombre = String(formData.get("nombre") || "").trim();
  const tipo = String(formData.get("tipo") || "maximo") === "minimo" ? "minimo" : "maximo";
  const meta = Math.max(Number(formData.get("meta") || 0), 0) / 100;
  if (!nombre) return;

  const { data: existing } = await supabase
    .from("personal_budget_categories")
    .select("clave, orden")
    .eq("space_id", space.id);
  const claves = new Set((existing ?? []).map((c) => c.clave as string));
  let clave = slugify(nombre);
  if (ESTRUCTURALES.has(clave) || claves.has(clave)) {
    clave = `${clave}-${crypto.randomUUID().slice(0, 4)}`;
  }
  const maxOrden = (existing ?? []).reduce((m, c) => Math.max(m, Number(c.orden) || 0), 0);

  const { error } = await supabase.from("personal_budget_categories").insert({
    space_id: space.id,
    clave,
    nombre,
    tipo,
    meta,
    orden: maxOrden + 1,
  });
  if (error) console.error("addPersonalCategory failed:", error.message);

  revalidateBudget();
}

export async function updatePersonalCategory(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const id = String(formData.get("id") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const tipo = String(formData.get("tipo") || "maximo") === "minimo" ? "minimo" : "maximo";
  const meta = Math.max(Number(formData.get("meta") || 0), 0) / 100;
  if (!id || !nombre) return;

  const { error } = await supabase
    .from("personal_budget_categories")
    .update({ nombre, tipo, meta })
    .eq("id", id)
    .eq("space_id", space.id);
  if (error) console.error("updatePersonalCategory failed:", error.message);

  revalidateBudget();
}

export async function deletePersonalCategory(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const id = String(formData.get("id") || "");
  const clave = String(formData.get("clave") || "");
  if (!id || !clave || ESTRUCTURALES.has(clave)) return;

  // Borra la categoría y todas sus líneas (como en el Presupuesto Familiar).
  await supabase.from("budget_items").delete().eq("space_id", space.id).eq("categoria", clave);
  await supabase
    .from("personal_budget_categories")
    .delete()
    .eq("id", id)
    .eq("space_id", space.id);

  revalidateBudget();
}

/** Persiste el orden de las categorías tras arrastrar-y-soltar. Nunca lanza. */
export async function reorderPersonalCategories(
  orderedIds: string[],
): Promise<{ ok: boolean }> {
  try {
    const { space, supabase } = await getPersonalContext();
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { ok: false };
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (typeof id !== "string") continue;
      await supabase
        .from("personal_budget_categories")
        .update({ orden: i + 1 })
        .eq("id", id)
        .eq("space_id", space.id);
    }
    revalidateBudget();
    return { ok: true };
  } catch (e) {
    console.error("reorderPersonalCategories failed:", e);
    return { ok: false };
  }
}

export async function updateMetaDeuda(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const meta = Math.max(Number(formData.get("meta") || 0), 0) / 100;
  await supabase.from("personal_spaces").update({ meta_deuda: meta }).eq("id", space.id);
  revalidateBudget();
}

/**
 * Devuelve las 6 categorías base a su nombre / tipo / meta por defecto y recrea
 * las que falten. No toca las categorías personalizadas.
 */
export async function restoreDefaultCategories() {
  const { space, supabase } = await getPersonalContext();
  const es = space.idioma !== "en";

  const { data: existing } = await supabase
    .from("personal_budget_categories")
    .select("clave, orden")
    .eq("space_id", space.id);
  const ordenByClave = new Map(
    (existing ?? []).map((c) => [c.clave as string, Number(c.orden) || 0]),
  );
  let maxOrden = Math.max(0, ...ordenByClave.values());

  for (const c of DEFAULT_PERSONAL_CATEGORIES) {
    const base = { nombre: es ? c.nombreEs : c.nombreEn, tipo: c.tipo, meta: c.meta };
    if (ordenByClave.has(c.clave)) {
      await supabase
        .from("personal_budget_categories")
        .update(base)
        .eq("space_id", space.id)
        .eq("clave", c.clave);
    } else {
      await supabase
        .from("personal_budget_categories")
        .insert({ space_id: space.id, clave: c.clave, orden: ++maxOrden, ...base });
    }
  }

  revalidatePath("/config");
  revalidateBudget();
}
