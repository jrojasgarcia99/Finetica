"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";

function redirectConfig(msg: string): never {
  redirect(`/config?error=${encodeURIComponent(msg)}`);
}

export async function updateConfig(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const pctFields = [
    "meta_gastos",
    "meta_ahorro",
    "meta_inversion",
    "meta_jugar",
    "meta_donativos",
    "meta_formacion",
    "meta_deuda",
  ];

  const update: Record<string, number> = {};
  for (const f of pctFields) {
    const raw = formData.get(f);
    if (raw !== null) update[f] = Number(raw) / 100;
  }
  update.meses_fondo_basico = Number(formData.get("meses_fondo_basico") || space.meses_fondo_basico);
  update.meses_fondo_ideal = Number(formData.get("meses_fondo_ideal") || space.meses_fondo_ideal);

  await supabase.from("personal_spaces").update(update).eq("id", space.id);

  revalidatePath("/config");
  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
  revalidatePath("/fondo-emergencia");
}

const MONEDAS_VALIDAS = ["CRC", "USD"] as const;
type MonedaCode = (typeof MONEDAS_VALIDAS)[number];

export async function updateMonedas(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const activas = formData
    .getAll("activas")
    .map(String)
    .filter((m): m is MonedaCode => (MONEDAS_VALIDAS as readonly string[]).includes(m));

  const monedas_activas = activas.length ? Array.from(new Set(activas)) : ["CRC"];

  let moneda_primaria = String(formData.get("moneda_primaria") || "");
  if (!monedas_activas.includes(moneda_primaria)) {
    moneda_primaria = monedas_activas[0];
  }

  await supabase
    .from("personal_spaces")
    .update({ monedas_activas, moneda_primaria })
    .eq("id", space.id);

  revalidatePath("/", "layout");
}

export async function updateProfile(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const display_name = String(formData.get("display_name") || "").trim();
  const salario_mensual = Number(formData.get("salario_mensual") || 0);
  const update: Record<string, unknown> = { salario_mensual };
  if (display_name) update.display_name = display_name;
  await supabase.from("personal_spaces").update(update).eq("id", space.id);
  revalidatePath("/", "layout");
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
  revalidatePath("/familiar");
}

// --- Presupuesto Familiar ---------------------------------------------------

export async function activateFamilyBudget() {
  const { supabase } = await getPersonalContext();
  const { error } = await supabase.rpc("create_family_budget");
  if (error) {
    redirectConfig(
      error.message === "ALREADY_LINKED"
        ? "Tu cuenta ya está en un Presupuesto Familiar."
        : error.message,
    );
  }
  revalidatePath("/config");
  revalidatePath("/familiar");
}

export async function joinFamilyBudgetByCode(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const code = String(formData.get("code") || "").trim();
  if (!code) redirectConfig("Ingresa un código.");

  const { error } = await supabase.rpc("join_family_budget", { code });
  if (error) {
    const msg =
      error.message === "INVALID_CODE"
        ? "Ese código no existe. Verifícalo con quien te lo compartió."
        : error.message === "ALREADY_LINKED"
          ? "Tu cuenta ya está en un Presupuesto Familiar. Salí de él antes de unirte a otro."
          : error.message === "CURRENCY_MISMATCH"
            ? "No puedes vincularte: tu moneda primaria y la del Presupuesto Familiar son distintas. Igualá la moneda primaria en Configuración → Monedas y volvé a intentar."
            : error.message;
    redirectConfig(msg);
  }
  revalidatePath("/config");
  revalidatePath("/familiar");
}

export async function leaveFamilyBudget() {
  const { supabase } = await getPersonalContext();
  await supabase.rpc("leave_family_budget");
  revalidatePath("/config");
  revalidatePath("/familiar");
}
