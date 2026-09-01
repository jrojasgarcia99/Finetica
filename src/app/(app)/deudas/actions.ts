"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/data";

export async function addDeuda(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") || "").trim();
  const institucion = String(formData.get("institucion") || "").trim();
  const monto_original = Number(formData.get("monto_original") || 0);
  const saldo_actual = Number(formData.get("saldo_actual") || 0);
  const tasa_interes_anual = Number(formData.get("tasa_interes_anual") || 0);
  const cuota_minima = Number(formData.get("cuota_minima") || 0);
  const fecha_inicio = String(formData.get("fecha_inicio") || "") || null;

  if (!nombre) return;

  await supabase.from("deudas").insert({
    household_id: household.id,
    nombre,
    institucion,
    monto_original,
    saldo_actual,
    tasa_interes_anual,
    cuota_minima,
    fecha_inicio,
    estado: "Activa",
  });

  revalidatePath("/deudas");
  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function deleteDeuda(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("deudas").delete().eq("id", id).eq("household_id", household.id);
  revalidatePath("/deudas");
  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function toggleEstadoDeuda(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const estadoActual = String(formData.get("estado"));
  const nuevo = estadoActual === "Activa" ? "Pagada" : "Activa";
  await supabase
    .from("deudas")
    .update({ estado: nuevo })
    .eq("id", id)
    .eq("household_id", household.id);
  revalidatePath("/deudas");
  revalidatePath("/presupuesto");
  revalidatePath("/dashboard");
}

export async function updatePagoExtraBase(formData: FormData) {
  const { household } = await getHouseholdContext();
  const supabase = await createClient();
  const pago_extra_base = Number(formData.get("pago_extra_base") || 0);
  await supabase.from("households").update({ pago_extra_base }).eq("id", household.id);
  revalidatePath("/deudas");
}
