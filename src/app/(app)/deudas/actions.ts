"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";

function revalidateDeudas() {
  revalidatePath("/deudas");
  revalidatePath("/presupuesto");
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function addDeuda(formData: FormData) {
  const { space, currency, supabase } = await getPersonalContext();

  const nombre = String(formData.get("nombre") || "").trim();
  const institucion = String(formData.get("institucion") || "").trim();
  const monto_original = Number(formData.get("monto_original") || 0);
  const saldo_actual = Number(formData.get("saldo_actual") || 0);
  const tasa_interes_anual = Number(formData.get("tasa_interes_anual") || 0);
  const cuota_minima = Number(formData.get("cuota_minima") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  const fecha_inicio = String(formData.get("fecha_inicio") || "") || null;

  if (!nombre) return;

  await supabase.from("deudas").insert({
    space_id: space.id,
    nombre,
    institucion,
    monto_original,
    saldo_actual,
    tasa_interes_anual,
    cuota_minima,
    moneda,
    fecha_inicio,
    estado: "Activa",
  });

  revalidateDeudas();
  redirect("/deudas");
}

export async function updateDeuda(formData: FormData) {
  const { space, currency, supabase } = await getPersonalContext();

  const id = String(formData.get("id"));
  const nombre = String(formData.get("nombre") || "").trim();
  const institucion = String(formData.get("institucion") || "").trim();
  const monto_original = Number(formData.get("monto_original") || 0);
  const saldo_actual = Number(formData.get("saldo_actual") || 0);
  const tasa_interes_anual = Number(formData.get("tasa_interes_anual") || 0);
  const cuota_minima = Number(formData.get("cuota_minima") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  const fecha_inicio = String(formData.get("fecha_inicio") || "") || null;

  if (!id || !nombre) return;

  const update: Record<string, unknown> = {
    nombre,
    institucion,
    monto_original,
    saldo_actual,
    tasa_interes_anual,
    cuota_minima,
    moneda,
    fecha_inicio,
  };
  // Si le vuelven a poner saldo a una deuda pagada, se reactiva sola.
  if (saldo_actual > 0) update.estado = "Activa";

  await supabase.from("deudas").update(update).eq("id", id).eq("space_id", space.id);

  revalidateDeudas();
}

export async function deleteDeuda(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const id = String(formData.get("id"));
  await supabase.from("deudas").delete().eq("id", id).eq("space_id", space.id);
  revalidateDeudas();
}

export async function toggleEstadoDeuda(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const id = String(formData.get("id"));
  const estadoActual = String(formData.get("estado"));
  const nuevo = estadoActual === "Activa" ? "Pagada" : "Activa";
  await supabase
    .from("deudas")
    .update({ estado: nuevo })
    .eq("id", id)
    .eq("space_id", space.id);
  revalidateDeudas();
}

/**
 * Reinicia las deudas: borra TODO el historial de pagos (`debt_payments`) del
 * espacio y devuelve cada deuda a su saldo original y estado "Activa". El
 * rollover mensual volverá a registrar pagos de acá en adelante.
 */
export async function resetDeudas() {
  const { space, supabase } = await getPersonalContext();

  await supabase.from("debt_payments").delete().eq("space_id", space.id);

  const { data: deudas } = await supabase
    .from("deudas")
    .select("id, monto_original")
    .eq("space_id", space.id);

  for (const d of deudas ?? []) {
    await supabase
      .from("deudas")
      .update({ saldo_actual: d.monto_original, estado: "Activa" })
      .eq("id", d.id)
      .eq("space_id", space.id);
  }

  revalidatePath("/config");
  revalidateDeudas();
}

export async function updatePagoExtraBase(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const pago_extra_base = Number(formData.get("pago_extra_base") || 0);
  await supabase.from("personal_spaces").update({ pago_extra_base }).eq("id", space.id);
  revalidatePath("/deudas");
}
