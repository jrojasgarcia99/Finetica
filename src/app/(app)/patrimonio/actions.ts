"use server";

import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";
import { normalizarMoneda } from "@/lib/currency";

async function ctx() {
  const { space, currency, supabase } = await getPersonalContext();
  return { space, currency, supabase };
}

export async function addActivo(formData: FormData) {
  const { space, currency, supabase } = await ctx();
  const concepto = String(formData.get("concepto") || "").trim();
  const valor = Number(formData.get("valor") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  if (!concepto) return;
  await supabase.from("activos").insert({ space_id: space.id, concepto, valor, moneda });
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function updateActivo(formData: FormData) {
  const { space, currency, supabase } = await ctx();
  const id = String(formData.get("id"));
  const concepto = String(formData.get("concepto") || "").trim();
  const valor = Number(formData.get("valor") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  if (!id || !concepto) return;
  await supabase
    .from("activos")
    .update({ concepto, valor, moneda })
    .eq("id", id)
    .eq("space_id", space.id);
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function deleteActivo(formData: FormData) {
  const { space, supabase } = await ctx();
  const id = String(formData.get("id"));
  await supabase.from("activos").delete().eq("id", id).eq("space_id", space.id);
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function addPasivo(formData: FormData) {
  const { space, currency, supabase } = await ctx();
  const concepto = String(formData.get("concepto") || "").trim();
  const valor = Number(formData.get("valor") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  if (!concepto) return;
  await supabase.from("pasivos").insert({ space_id: space.id, concepto, valor, moneda });
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function updatePasivo(formData: FormData) {
  const { space, currency, supabase } = await ctx();
  const id = String(formData.get("id"));
  const concepto = String(formData.get("concepto") || "").trim();
  const valor = Number(formData.get("valor") || 0);
  const moneda = normalizarMoneda(formData.get("moneda"), currency.activas, currency.primaria);
  if (!id || !concepto) return;
  await supabase
    .from("pasivos")
    .update({ concepto, valor, moneda })
    .eq("id", id)
    .eq("space_id", space.id);
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function deletePasivo(formData: FormData) {
  const { space, supabase } = await ctx();
  const id = String(formData.get("id"));
  await supabase.from("pasivos").delete().eq("id", id).eq("space_id", space.id);
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function updateEdad(formData: FormData) {
  const { space, supabase } = await ctx();
  const edad = Number(formData.get("edad") || 0);
  await supabase
    .from("personal_spaces")
    .update({ patrimonio_edad: edad || null })
    .eq("id", space.id);
  revalidatePath("/patrimonio");
}
