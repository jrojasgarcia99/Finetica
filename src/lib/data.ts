import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  FamilyBudget,
  FamilyBudgetMember,
  Moneda,
  PersonalSpace,
} from "@/lib/types";
import { aPrimaria, type CurrencyConfig } from "@/lib/currency";
import { normalizeLocale } from "@/lib/i18n";

type MonedaConfigRow = {
  monedas_activas: Moneda[] | null;
  moneda_primaria: Moneda | null;
  tipo_cambio: number | null;
};

/** Deriva la config de monedas (primaria / activas / tipo de cambio) de una fila. */
export function deriveCurrency(row: MonedaConfigRow): CurrencyConfig {
  const activasRaw = (row.monedas_activas ?? ["CRC"]) as Moneda[];
  const activas =
    Array.isArray(activasRaw) && activasRaw.length ? activasRaw : (["CRC"] as Moneda[]);
  const primaria: Moneda =
    row.moneda_primaria && activas.includes(row.moneda_primaria)
      ? row.moneda_primaria
      : activas[0];
  return { primaria, activas, tipoCambio: Number(row.tipo_cambio) || 0 };
}

/**
 * Contexto del espacio personal privado del usuario actual. Si aún no tiene
 * uno (cuenta nueva, o cuenta que quedó sin migrar), lo crea al vuelo.
 */
export async function getPersonalContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: space } = await supabase
    .from("personal_spaces")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<PersonalSpace>();

  if (!space) {
    const fallbackName = (user.email ?? "").split("@")[0] || "Mi espacio";
    await supabase
      .from("personal_spaces")
      .insert({ owner_id: user.id, display_name: fallbackName });
    // `unique(owner_id)` + `on conflict do nothing` no aplica vía PostgREST,
    // pero si dos requests corren a la vez uno falla y el re-select lo resuelve.
    const { data: created, error } = await supabase
      .from("personal_spaces")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle<PersonalSpace>();
    if (!created) {
      throw new Error(
        `No se pudo crear/cargar tu espacio personal${
          error ? ` (${error.message})` : ""
        }. Revisa las políticas RLS de "personal_spaces" (SELECT e INSERT).`,
      );
    }
    space = created;
  }

  return {
    supabase,
    user,
    space,
    currency: deriveCurrency(space),
    locale: normalizeLocale(space.idioma),
  };
}

/**
 * Copia las líneas recurrentes (del espacio personal del usuario Y de su
 * Presupuesto Familiar) al mes indicado, si ese mes está vacío y es igual o
 * posterior al último mes con datos. Lo hace la función SQL `rollover_for_me`
 * (idempotente). El pago mensual real de deudas NO ocurre acá — solo desde el
 * cron `run_monthly_rollover`.
 */
export async function rolloverForMe(anio: number, mes: number): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("rollover_for_me", { p_anio: anio, p_mes: mes });
}

export type FamilyBudgetContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  familyBudget: FamilyBudget;
  members: FamilyBudgetMember[];
  currency: CurrencyConfig;
};

/**
 * Contexto del Presupuesto Familiar del usuario, o `null` si su cuenta no está
 * vinculada a ninguno.
 */
export async function getFamilyBudgetContext(): Promise<FamilyBudgetContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("family_budget_members")
    .select("family_budget_id")
    .eq("user_id", user.id)
    .maybeSingle<{ family_budget_id: string }>();

  if (!membership) return null;

  const { data: familyBudget } = await supabase
    .from("family_budgets")
    .select("*")
    .eq("id", membership.family_budget_id)
    .maybeSingle<FamilyBudget>();

  if (!familyBudget) return null;

  // Los nombres y salarios de los demás miembros viven en sus espacios
  // personales (privados), así que se leen por una función SECURITY DEFINER.
  const { data: roster } = await supabase.rpc("family_budget_roster");

  const members: FamilyBudgetMember[] = (
    (roster ?? []) as {
      user_id: string;
      display_name: string;
      salario_mensual: number;
      joined_at: string;
    }[]
  ).map((r) => ({
    id: r.user_id,
    family_budget_id: familyBudget.id,
    user_id: r.user_id,
    joined_at: r.joined_at,
    display_name: r.display_name,
    salario_mensual: Number(r.salario_mensual) || 0,
  }));

  return {
    supabase,
    user,
    familyBudget,
    members,
    currency: deriveCurrency(familyBudget),
  };
}

/**
 * Calcula el "aporte según salario" que le toca al usuario actual en el
 * Presupuesto Familiar, por mes, ya convertido a `personalCurrency` (la moneda
 * primaria del espacio personal). Devuelve `null` si la cuenta no está en un
 * Presupuesto Familiar.
 *
 *   aporte(mes) = (mi salario / Σ salarios) × total de gastos del familiar ese mes
 */
export async function getFamilyRepartoContext(personalCurrency: CurrencyConfig) {
  const fam = await getFamilyBudgetContext();
  if (!fam) return null;

  const { supabase, familyBudget, members, currency, user } = fam;

  const { data: rowsRaw } = await supabase
    .from("family_budget_items")
    .select("monto, moneda, mes, anio")
    .eq("family_budget_id", familyBudget.id);

  const rows = (rowsRaw ?? []) as {
    monto: number;
    moneda: Moneda;
    mes: number;
    anio: number;
  }[];

  const sumaSalarios = members.reduce((a, m) => a + Number(m.salario_mensual), 0);
  const mine = members.find((m) => m.user_id === user.id);
  const fraccion = sumaSalarios ? Number(mine?.salario_mensual ?? 0) / sumaSalarios : 0;

  return {
    /** Aporte del usuario para (mes, anio), en la moneda primaria personal. */
    shareFor(mes: number, anio: number): number {
      const totalMes = rows
        .filter((r) => r.mes === mes && r.anio === anio)
        .reduce((a, r) => a + aPrimaria(Number(r.monto), r.moneda, currency), 0);
      const enFamiliar = totalMes * fraccion;
      // convertir de la primaria del familiar a la primaria personal (normalmente
      // son la misma, así que esto es un no-op)
      return aPrimaria(enFamiliar, currency.primaria, personalCurrency);
    },
  };
}
