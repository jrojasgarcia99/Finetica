"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPersonalContext, getFamilyBudgetContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";
import { envelopePeriodStart, toISODate, nowCR } from "@/lib/envelopes";
import { ENVELOPE_ICON_NAMES } from "@/lib/types";
import type { Envelope, Moneda } from "@/lib/types";

const ICON_NAMES = new Set<string>(ENVELOPE_ICON_NAMES as readonly string[]);

function currentMesAnio(): { mes: number; anio: number } {
  const d = nowCR();
  return { mes: d.getMonth() + 1, anio: d.getFullYear() };
}

// --- Sobres ---------------------------------------------------------------

export async function createEnvelope(formData: FormData) {
  const { supabase, space, user, currency } = await getPersonalContext();

  const wantsFamily = String(formData.get("scope") || "personal") === "family";
  const sourceLineId = String(formData.get("source_line_id") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const limite_mensual = Number(formData.get("limite_mensual") || 0);
  const iconoRaw = String(formData.get("icono") || "Wallet");
  const icono = ICON_NAMES.has(iconoRaw) ? iconoRaw : "Wallet";
  const diaRaw = Number(formData.get("reinicio_dia"));
  const reinicio_dia = Number.isInteger(diaRaw) && diaRaw >= 1 && diaRaw <= 31 ? diaRaw : null;

  if (!sourceLineId || !nombre) return;

  const { mes, anio } = currentMesAnio();

  let insert: Record<string, unknown>;
  let scopeCol: "space_id" | "family_budget_id";
  let scopeVal: string;

  if (wantsFamily) {
    const fam = await getFamilyBudgetContext();
    if (!fam) return;
    const { data: line } = await fam.supabase
      .from("family_budget_items")
      .select("id, categoria, moneda")
      .eq("id", sourceLineId)
      .eq("family_budget_id", fam.familyBudget.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .maybeSingle<{ id: string; categoria: string; moneda: Moneda }>();
    if (!line) return;

    scopeCol = "family_budget_id";
    scopeVal = fam.familyBudget.id;
    insert = {
      scope_type: "family",
      space_id: null,
      family_budget_id: fam.familyBudget.id,
      nombre,
      categoria: line.categoria,
      moneda: normalizarMoneda(formData.get("moneda"), fam.currency.activas, fam.currency.primaria),
      limite_mensual,
      icono,
      reinicio_dia,
      source_budget_item_id: null,
      source_family_budget_item_id: line.id,
      created_by: user.id,
    };
  } else {
    const { data: line } = await supabase
      .from("budget_items")
      .select("id, categoria, moneda")
      .eq("id", sourceLineId)
      .eq("space_id", space.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .maybeSingle<{ id: string; categoria: string; moneda: Moneda }>();
    if (!line) return;

    const { data: cat } = await supabase
      .from("personal_budget_categories")
      .select("clave")
      .eq("space_id", space.id)
      .eq("clave", line.categoria)
      .maybeSingle();
    if (!cat) return;

    scopeCol = "space_id";
    scopeVal = space.id;
    insert = {
      scope_type: "personal",
      space_id: space.id,
      family_budget_id: null,
      nombre,
      categoria: line.categoria,
      moneda: normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria),
      limite_mensual,
      icono,
      reinicio_dia,
      source_budget_item_id: line.id,
      source_family_budget_item_id: null,
      created_by: user.id,
    };
  }

  const { data: last } = await supabase
    .from("envelopes")
    .select("orden")
    .eq(scopeCol, scopeVal)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle<{ orden: number }>();

  const { error } = await supabase.from("envelopes").insert({
    ...insert,
    ciclo_inicio: toISODate(envelopePeriodStart(reinicio_dia, nowCR())),
    orden: (last?.orden ?? -1) + 1,
  });
  if (error) {
    console.error("createEnvelope failed:", error.message);
    return;
  }

  revalidatePath("/sobres");
  redirect("/sobres");
}

/** Edita nombre / ícono / meta (presupuesto o ilimitada) de un sobre existente. */
export async function updateEnvelope(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const iconoRaw = String(formData.get("icono") || "Wallet");
  const icono = ICON_NAMES.has(iconoRaw) ? iconoRaw : "Wallet";
  const limite_ilimitado = formData.get("limite_ilimitado") != null;
  const limite_mensual = limite_ilimitado
    ? 0
    : Math.max(Number(formData.get("limite_mensual") || 0), 0);

  if (!id || !nombre) return;

  await supabase
    .from("envelopes")
    .update({ nombre, icono, limite_mensual, limite_ilimitado })
    .eq("id", id);

  revalidatePath("/sobres");
  revalidatePath(`/sobres/${id}`);
}

export async function deleteEnvelope(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;

  // Los movimientos caen por `on delete cascade`. La línea del presupuesto de
  // origen NO se toca (el sobre nunca la creó, solo la referenciaba).
  await supabase.from("envelopes").delete().eq("id", id);

  revalidatePath("/sobres");
  redirect("/sobres");
}

export async function resetEnvelopeNow(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("envelopes").update({ ciclo_inicio: toISODate(nowCR()) }).eq("id", id);

  revalidatePath("/sobres");
  revalidatePath(`/sobres/${id}`);
}

// --- Movimientos (internos del sobre; no tocan el presupuesto) -----------

export async function addEnvelopeMovement(formData: FormData) {
  const { supabase, user } = await getPersonalContext();

  const envelope_id = String(formData.get("envelope_id") || "");
  const tipo = String(formData.get("tipo") || "expense") === "income" ? "income" : "expense";
  const descripcion = String(formData.get("descripcion") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const fecha = String(formData.get("fecha") || "").trim() || toISODate(nowCR());
  const metodo_pago = String(formData.get("metodo_pago") || "").trim() || null;

  if (!envelope_id || !descripcion || !(monto > 0)) return;

  const { data: env } = await supabase
    .from("envelopes")
    .select("moneda")
    .eq("id", envelope_id)
    .maybeSingle<Pick<Envelope, "moneda">>();
  if (!env) return;

  const { error } = await supabase.from("envelope_movements").insert({
    envelope_id,
    tipo,
    descripcion,
    monto,
    moneda: env.moneda,
    fecha,
    metodo_pago,
    created_by: user.id,
  });
  if (error) console.error("addEnvelopeMovement failed:", error.message);

  revalidatePath("/sobres");
  revalidatePath(`/sobres/${envelope_id}`);
}

export async function updateEnvelopeMovement(formData: FormData) {
  const { supabase } = await getPersonalContext();

  const id = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "expense") === "income" ? "income" : "expense";
  const descripcion = String(formData.get("descripcion") || "").trim();
  const monto = Number(formData.get("monto") || 0);
  const fecha = String(formData.get("fecha") || "").trim() || toISODate(nowCR());
  const metodo_pago = String(formData.get("metodo_pago") || "").trim() || null;

  if (!id || !descripcion || !(monto > 0)) return;

  const { data: mv } = await supabase
    .from("envelope_movements")
    .select("envelope_id")
    .eq("id", id)
    .maybeSingle<{ envelope_id: string }>();
  if (!mv) return;

  const { error } = await supabase
    .from("envelope_movements")
    .update({ tipo, descripcion, monto, fecha, metodo_pago })
    .eq("id", id);
  if (error) console.error("updateEnvelopeMovement failed:", error.message);

  revalidatePath("/sobres");
  revalidatePath(`/sobres/${mv.envelope_id}`);
}

export async function deleteEnvelopeMovement(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data: mv } = await supabase
    .from("envelope_movements")
    .select("envelope_id")
    .eq("id", id)
    .maybeSingle<{ envelope_id: string }>();

  await supabase.from("envelope_movements").delete().eq("id", id);

  revalidatePath("/sobres");
  if (mv) revalidatePath(`/sobres/${mv.envelope_id}`);
}
