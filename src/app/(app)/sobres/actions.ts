"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPersonalContext, getFamilyBudgetContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";
import { envelopePeriodStart, toISODate, nowCR } from "@/lib/envelopes";
import { CATEGORIA_KEYS, ENVELOPE_ICON_NAMES } from "@/lib/types";
import type { Envelope, EnvelopeMovement, Moneda } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type SB = SupabaseClient;

const PERSONAL_CATS = new Set<string>(CATEGORIA_KEYS);
const ICON_NAMES = new Set<string>(ENVELOPE_ICON_NAMES as readonly string[]);

function revalidateBudgetSurfaces() {
  revalidatePath("/sobres");
  revalidatePath("/presupuesto");
  revalidatePath("/familiar");
  revalidatePath("/dashboard");
}

function mesAnioDe(fecha: string): { mes: number; anio: number } {
  const [y, m] = fecha.split("-").map(Number);
  return { mes: m || 1, anio: y || nowCR().getFullYear() };
}

async function getEnvelope(supabase: SB, id: string): Promise<Envelope | null> {
  const { data } = await supabase.from("envelopes").select("*").eq("id", id).maybeSingle();
  return (data as Envelope) ?? null;
}

/** Inserta la línea de presupuesto que refleja un expense del sobre. */
async function insertBudgetLine(
  supabase: SB,
  env: Envelope,
  args: { concepto: string; monto: number; moneda: Moneda; mes: number; anio: number; userId: string },
): Promise<{ budget_item_id: string | null; family_budget_item_id: string | null }> {
  const { concepto, monto, moneda, mes, anio, userId } = args;

  if (env.scope_type === "personal") {
    const { data: last } = await supabase
      .from("budget_items")
      .select("orden")
      .eq("space_id", env.space_id)
      .eq("categoria", env.categoria)
      .eq("mes", mes)
      .eq("anio", anio)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle<{ orden: number }>();

    const { data, error } = await supabase
      .from("budget_items")
      .insert({
        space_id: env.space_id,
        categoria: env.categoria,
        concepto,
        monto,
        moneda,
        automatico: false,
        recurrente: false,
        orden: (last?.orden ?? -1) + 1,
        mes,
        anio,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) console.error("insertBudgetLine (personal) failed:", error.message);
    return { budget_item_id: data?.id ?? null, family_budget_item_id: null };
  }

  const { data: last } = await supabase
    .from("family_budget_items")
    .select("orden")
    .eq("family_budget_id", env.family_budget_id)
    .eq("categoria", env.categoria)
    .eq("mes", mes)
    .eq("anio", anio)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle<{ orden: number }>();

  const { data, error } = await supabase
    .from("family_budget_items")
    .insert({
      family_budget_id: env.family_budget_id,
      categoria: env.categoria,
      concepto,
      monto,
      moneda,
      automatico: false,
      recurrente: false,
      orden: (last?.orden ?? -1) + 1,
      mes,
      anio,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) console.error("insertBudgetLine (family) failed:", error.message);
  return { budget_item_id: null, family_budget_item_id: data?.id ?? null };
}

async function updateBudgetLine(
  supabase: SB,
  mv: Pick<EnvelopeMovement, "budget_item_id" | "family_budget_item_id">,
  patch: { concepto: string; monto: number; moneda: Moneda; mes: number; anio: number },
) {
  if (mv.budget_item_id) {
    await supabase.from("budget_items").update(patch).eq("id", mv.budget_item_id);
  }
  if (mv.family_budget_item_id) {
    await supabase.from("family_budget_items").update(patch).eq("id", mv.family_budget_item_id);
  }
}

async function deleteBudgetLine(
  supabase: SB,
  mv: Pick<EnvelopeMovement, "budget_item_id" | "family_budget_item_id">,
) {
  if (mv.budget_item_id) {
    await supabase.from("budget_items").delete().eq("id", mv.budget_item_id);
  }
  if (mv.family_budget_item_id) {
    await supabase.from("family_budget_items").delete().eq("id", mv.family_budget_item_id);
  }
}

// --- Sobres ---------------------------------------------------------------

export async function createEnvelope(formData: FormData) {
  const { supabase, space, user, currency } = await getPersonalContext();

  const nombre = String(formData.get("nombre") || "").trim();
  const scope = String(formData.get("scope") || "personal") === "family" ? "family" : "personal";
  const categoria = String(formData.get("categoria") || "").trim();
  const limite_mensual = Number(formData.get("limite_mensual") || 0);
  const iconoRaw = String(formData.get("icono") || "Wallet");
  const icono = ICON_NAMES.has(iconoRaw) ? iconoRaw : "Wallet";
  const diaRaw = Number(formData.get("reinicio_dia"));
  const reinicio_dia = Number.isInteger(diaRaw) && diaRaw >= 1 && diaRaw <= 31 ? diaRaw : null;

  if (!nombre || !categoria) return;

  let fields:
    | { scope_type: "personal"; space_id: string; family_budget_id: null; moneda: Moneda }
    | { scope_type: "family"; space_id: null; family_budget_id: string; moneda: Moneda };

  if (scope === "family") {
    const fam = await getFamilyBudgetContext();
    if (!fam) return;
    const { data: cats } = await fam.supabase
      .from("family_budget_categories")
      .select("nombre")
      .eq("family_budget_id", fam.familyBudget.id);
    const valid = new Set((cats ?? []).map((c) => c.nombre as string));
    if (!valid.has(categoria)) return;
    fields = {
      scope_type: "family",
      space_id: null,
      family_budget_id: fam.familyBudget.id,
      moneda: normalizarMoneda(formData.get("moneda"), fam.currency.activas, fam.currency.primaria),
    };
  } else {
    if (!PERSONAL_CATS.has(categoria)) return;
    fields = {
      scope_type: "personal",
      space_id: space.id,
      family_budget_id: null,
      moneda: normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria),
    };
  }

  const scopeCol = scope === "family" ? "family_budget_id" : "space_id";
  const scopeVal = scope === "family" ? fields.family_budget_id : fields.space_id;
  const { data: last } = await supabase
    .from("envelopes")
    .select("orden")
    .eq(scopeCol, scopeVal)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle<{ orden: number }>();

  const { error } = await supabase.from("envelopes").insert({
    ...fields,
    nombre,
    categoria,
    limite_mensual,
    icono,
    reinicio_dia,
    ciclo_inicio: toISODate(envelopePeriodStart(reinicio_dia, nowCR())),
    orden: (last?.orden ?? -1) + 1,
    created_by: user.id,
  });
  if (error) console.error("createEnvelope failed:", error.message);

  revalidatePath("/sobres");
}

export async function deleteEnvelope(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data: movs } = await supabase
    .from("envelope_movements")
    .select("budget_item_id, family_budget_item_id")
    .eq("envelope_id", id);

  const budgetIds = (movs ?? []).map((m) => m.budget_item_id).filter(Boolean) as string[];
  const familyIds = (movs ?? []).map((m) => m.family_budget_item_id).filter(Boolean) as string[];
  if (budgetIds.length) await supabase.from("budget_items").delete().in("id", budgetIds);
  if (familyIds.length) await supabase.from("family_budget_items").delete().in("id", familyIds);

  await supabase.from("envelopes").delete().eq("id", id);

  revalidateBudgetSurfaces();
  redirect("/sobres");
}

export async function resetEnvelopeNow(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase
    .from("envelopes")
    .update({ ciclo_inicio: toISODate(nowCR()) })
    .eq("id", id);

  revalidatePath("/sobres");
  revalidatePath(`/sobres/${id}`);
}

// --- Movimientos --------------------------------------------------------

export async function addEnvelopeMovement(formData: FormData) {
  const { supabase, user } = await getPersonalContext();

  const envelope_id = String(formData.get("envelope_id") || "");
  const tipo = String(formData.get("tipo") || "expense") === "income" ? "income" : "expense";
  const descripcion = String(formData.get("descripcion") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const fecha = String(formData.get("fecha") || "").trim() || toISODate(nowCR());
  const metodo_pago = String(formData.get("metodo_pago") || "").trim() || null;

  if (!envelope_id || !descripcion || !(monto > 0)) return;

  const env = await getEnvelope(supabase, envelope_id);
  if (!env) return;

  let link: { budget_item_id: string | null; family_budget_item_id: string | null } = {
    budget_item_id: null,
    family_budget_item_id: null,
  };

  if (tipo === "expense") {
    const { mes, anio } = mesAnioDe(fecha);
    link = await insertBudgetLine(supabase, env, {
      concepto: descripcion,
      monto,
      moneda: env.moneda,
      mes,
      anio,
      userId: user.id,
    });
  }

  const { error } = await supabase.from("envelope_movements").insert({
    envelope_id,
    tipo,
    descripcion,
    monto,
    moneda: env.moneda,
    fecha,
    metodo_pago,
    created_by: user.id,
    ...link,
  });
  if (error) console.error("addEnvelopeMovement failed:", error.message);

  revalidateBudgetSurfaces();
  revalidatePath(`/sobres/${envelope_id}`);
}

export async function updateEnvelopeMovement(formData: FormData) {
  const { supabase, user } = await getPersonalContext();

  const id = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "expense") === "income" ? "income" : "expense";
  const descripcion = String(formData.get("descripcion") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const fecha = String(formData.get("fecha") || "").trim() || toISODate(nowCR());
  const metodo_pago = String(formData.get("metodo_pago") || "").trim() || null;

  if (!id || !descripcion || !(monto > 0)) return;

  const { data: mvRaw } = await supabase
    .from("envelope_movements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const mv = mvRaw as EnvelopeMovement | null;
  if (!mv) return;

  const env = await getEnvelope(supabase, mv.envelope_id);
  if (!env) return;

  const { mes, anio } = mesAnioDe(fecha);
  const linePatch = { concepto: descripcion, monto, moneda: env.moneda, mes, anio };
  let link = { budget_item_id: mv.budget_item_id, family_budget_item_id: mv.family_budget_item_id };

  const wasExpense = mv.tipo === "expense";
  const isExpense = tipo === "expense";

  if (wasExpense && isExpense) {
    if (mv.budget_item_id || mv.family_budget_item_id) {
      await updateBudgetLine(supabase, mv, linePatch);
    } else {
      link = await insertBudgetLine(supabase, env, { ...linePatch, userId: user.id });
    }
  } else if (wasExpense && !isExpense) {
    await deleteBudgetLine(supabase, mv);
    link = { budget_item_id: null, family_budget_item_id: null };
  } else if (!wasExpense && isExpense) {
    link = await insertBudgetLine(supabase, env, { ...linePatch, userId: user.id });
  }

  const { error } = await supabase
    .from("envelope_movements")
    .update({ tipo, descripcion, monto, moneda: env.moneda, fecha, metodo_pago, ...link })
    .eq("id", id);
  if (error) console.error("updateEnvelopeMovement failed:", error.message);

  revalidateBudgetSurfaces();
  revalidatePath(`/sobres/${mv.envelope_id}`);
}

export async function deleteEnvelopeMovement(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data: mvRaw } = await supabase
    .from("envelope_movements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const mv = mvRaw as EnvelopeMovement | null;
  if (!mv) return;

  await deleteBudgetLine(supabase, mv);
  await supabase.from("envelope_movements").delete().eq("id", id);

  revalidateBudgetSurfaces();
  revalidatePath(`/sobres/${mv.envelope_id}`);
}
