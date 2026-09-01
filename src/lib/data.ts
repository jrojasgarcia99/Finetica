import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  FamilyBudget,
  FamilyBudgetMember,
  Moneda,
  PersonalSpace,
} from "@/lib/types";
import type { CurrencyConfig } from "@/lib/currency";

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

  return { supabase, user, space, currency: deriveCurrency(space) };
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
