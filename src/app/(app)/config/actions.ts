"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getPersonalContext } from "@/lib/data";
import { getRequestLocale, LOCALE_COOKIE } from "@/lib/i18n/locale";
import { normalizeLocale, tFor } from "@/lib/i18n";
import { NAV_HREFS } from "@/components/layout/nav-items";

function redirectConfig(msg: string): never {
  redirect(`/config?error=${encodeURIComponent(msg)}`);
}

export async function updateIdioma(formData: FormData) {
  const { space, supabase } = await getPersonalContext();
  const idioma = normalizeLocale(formData.get("idioma"));
  await supabase.from("personal_spaces").update({ idioma }).eq("id", space.id);
  (await cookies()).set(LOCALE_COOKIE, idioma, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function updateConfig(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const update = {
    meses_fondo_basico: Number(formData.get("meses_fondo_basico") || space.meses_fondo_basico),
    meses_fondo_ideal: Number(formData.get("meses_fondo_ideal") || space.meses_fondo_ideal),
  };

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
  const t = tFor(await getRequestLocale());
  const { error } = await supabase.rpc("create_family_budget");
  if (error) {
    redirectConfig(
      error.message === "ALREADY_LINKED" ? t("err.alreadyLinkedActivate") : error.message,
    );
  }
  revalidatePath("/config");
  revalidatePath("/familiar");
}

export async function joinFamilyBudgetByCode(formData: FormData) {
  const { supabase } = await getPersonalContext();
  const t = tFor(await getRequestLocale());
  const code = String(formData.get("code") || "").trim();
  if (!code) redirectConfig(t("err.enterCode"));

  const { error } = await supabase.rpc("join_family_budget", { code });
  if (error) {
    const msg =
      error.message === "INVALID_CODE"
        ? t("err.invalidCode")
        : error.message === "ALREADY_LINKED"
          ? t("err.alreadyLinkedJoin")
          : error.message === "CURRENCY_MISMATCH"
            ? t("err.currencyMismatch")
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

// --- Métodos de pago (para los Sobres) ------------------------------------

export async function addPaymentMethod(formData: FormData) {
  const { supabase, user } = await getPersonalContext();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;

  const { data: last } = await supabase
    .from("payment_methods")
    .select("orden")
    .eq("user_id", user.id)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle<{ orden: number }>();

  await supabase
    .from("payment_methods")
    .insert({ user_id: user.id, nombre, orden: (last?.orden ?? -1) + 1 });

  revalidatePath("/config");
  revalidatePath("/sobres");
}

export async function deletePaymentMethod(formData: FormData) {
  const { supabase, user } = await getPersonalContext();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("payment_methods").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/config");
  revalidatePath("/sobres");
}

// --- Orden del menú -------------------------------------------------------

export async function updateNavOrder(orderedHrefs: string[]): Promise<{ ok: boolean }> {
  try {
    const { space, supabase } = await getPersonalContext();
    if (!Array.isArray(orderedHrefs)) return { ok: false };

    const known = new Set(NAV_HREFS);
    const seen = new Set<string>();
    const order: string[] = [];
    for (const h of orderedHrefs) {
      if (known.has(h) && !seen.has(h)) {
        order.push(h);
        seen.add(h);
      }
    }
    for (const h of NAV_HREFS) if (!seen.has(h)) order.push(h);

    await supabase.from("personal_spaces").update({ nav_order: order }).eq("id", space.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("updateNavOrder failed:", e);
    return { ok: false };
  }
}
