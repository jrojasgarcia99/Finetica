import { getPersonalContext, getFamilyBudgetContext } from "@/lib/data";
import { tFor, type Locale } from "@/lib/i18n";
import { dupKey, type ExportRow } from "@/lib/xlsx-budget";

/**
 * Contexto compartido para importar / exportar líneas del Presupuesto. Une la
 * lógica común de los dos ámbitos (personal y familiar) detrás de una interfaz:
 * lista de categorías válidas, resolución nombre→clave, lectura del mes y alta
 * masiva de líneas. Sólo se usa desde el servidor.
 */

export type BudgetScope = "personal" | "family";

export type CommitRow = {
  /** Clave/categoría ya resuelta y validada. */
  categoria: string;
  concepto: string;
  monto: number;
  moneda: string;
  recurrente: boolean;
};

export type ScopeContext = {
  scope: BudgetScope;
  locale: Locale;
  /** Códigos de moneda activos del ámbito. */
  monedasActivas: string[];
  monedaPrimaria: string;
  /** Valores que van en la lista desplegable de Categoría (para la plantilla). */
  categoriaNames: string[];
  /** Resuelve el texto de una celda a { clave, nombre } o `null` si no es válida. */
  resolveCategoria: (input: string) => { key: string; name: string } | null;
  /** Líneas del mes indicado, para exportar. */
  readMonth: (mes: number, anio: number) => Promise<ExportRow[]>;
  /** `dupKey`s (categoría + concepto) de las líneas que ya hay en ese mes. */
  existingKeys: (mes: number, anio: number) => Promise<Set<string>>;
  /** Inserta líneas nuevas en el mes indicado. Devuelve cuántas insertó. */
  insertItems: (rows: CommitRow[], mes: number, anio: number) => Promise<number>;
};

function normKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Máximo `orden` por categoría dentro de un conjunto de filas existentes. */
function maxOrdenPorCategoria(
  existing: { categoria: string | null; orden: number | null }[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of existing) {
    const k = String(e.categoria ?? "");
    m.set(k, Math.max(m.get(k) ?? -1, Number(e.orden) || 0));
  }
  return m;
}

export async function getScopeContext(
  scope: BudgetScope,
): Promise<ScopeContext | null> {
  const personal = await getPersonalContext();
  const locale = personal.locale;
  const t = tFor(locale);

  if (scope === "family") {
    const fam = await getFamilyBudgetContext();
    if (!fam) return null;
    const { supabase, familyBudget, currency, user } = fam;

    const { data: cats } = await supabase
      .from("family_budget_categories")
      .select("nombre")
      .eq("family_budget_id", familyBudget.id)
      .order("orden", { ascending: true });

    const names = (cats ?? []).map((c) => c.nombre as string);
    const byName = new Map(names.map((n) => [normKey(n), n]));

    return {
      scope,
      locale,
      monedasActivas: currency.activas,
      monedaPrimaria: currency.primaria,
      categoriaNames: names,
      resolveCategoria: (input) => {
        const hit = byName.get(normKey(input));
        return hit ? { key: hit, name: hit } : null;
      },
      async readMonth(mes, anio) {
        const { data } = await supabase
          .from("family_budget_items")
          .select("categoria, concepto, monto, moneda, recurrente")
          .eq("family_budget_id", familyBudget.id)
          .eq("mes", mes)
          .eq("anio", anio)
          .order("orden", { ascending: true })
          .order("created_at", { ascending: true });
        return (data ?? []).map((r) => ({
          categoria: r.categoria as string,
          concepto: r.concepto as string,
          monto: Number(r.monto) || 0,
          moneda: r.moneda as string,
          recurrente: Boolean(r.recurrente),
        }));
      },
      async existingKeys(mes, anio) {
        const { data } = await supabase
          .from("family_budget_items")
          .select("categoria, concepto")
          .eq("family_budget_id", familyBudget.id)
          .eq("mes", mes)
          .eq("anio", anio);
        return new Set(
          (data ?? []).map((r) =>
            dupKey(String(r.categoria ?? ""), String(r.concepto ?? "")),
          ),
        );
      },
      async insertItems(rows, mes, anio) {
        if (rows.length === 0) return 0;
        const { data: existing } = await supabase
          .from("family_budget_items")
          .select("categoria, orden")
          .eq("family_budget_id", familyBudget.id)
          .eq("mes", mes)
          .eq("anio", anio);
        const maxByCat = maxOrdenPorCategoria(existing ?? []);
        const payload = rows.map((r) => {
          const next = (maxByCat.get(r.categoria) ?? -1) + 1;
          maxByCat.set(r.categoria, next);
          return {
            family_budget_id: familyBudget.id,
            categoria: r.categoria,
            concepto: r.concepto,
            monto: r.monto,
            moneda: r.moneda,
            automatico: false,
            recurrente: r.recurrente,
            orden: next,
            mes,
            anio,
            created_by: user.id,
          };
        });
        const { error } = await supabase.from("family_budget_items").insert(payload);
        if (error) throw new Error(error.message);
        return payload.length;
      },
    };
  }

  // --- personal ------------------------------------------------------
  const { supabase, space, user } = personal;

  const { data: cats } = await supabase
    .from("personal_budget_categories")
    .select("clave, nombre")
    .eq("space_id", space.id)
    .order("orden", { ascending: true });

  const entries: { key: string; name: string }[] = [
    { key: "ingresos", name: t("categoria.ingresos") },
    { key: "rebajos", name: t("categoria.rebajos") },
    ...(cats ?? []).map((c) => ({
      key: c.clave as string,
      name: c.nombre as string,
    })),
  ];

  // Se acepta tanto el nombre mostrado como la clave cruda ("ingresos").
  const byText = new Map<string, { key: string; name: string }>();
  for (const e of entries) {
    byText.set(normKey(e.name), e);
    byText.set(normKey(e.key), e);
  }
  const byKey = new Map(entries.map((e) => [e.key, e.name]));

  return {
    scope,
    locale,
    monedasActivas: personal.currency.activas,
    monedaPrimaria: personal.currency.primaria,
    categoriaNames: entries.map((e) => e.name),
    resolveCategoria: (input) => byText.get(normKey(input)) ?? null,
    async readMonth(mes, anio) {
      const { data } = await supabase
        .from("budget_items")
        .select("categoria, concepto, monto, moneda, recurrente")
        .eq("space_id", space.id)
        .eq("mes", mes)
        .eq("anio", anio)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: true });
      return (data ?? []).map((r) => ({
        categoria: byKey.get(r.categoria as string) ?? (r.categoria as string),
        concepto: r.concepto as string,
        monto: Number(r.monto) || 0,
        moneda: r.moneda as string,
        recurrente: Boolean(r.recurrente),
      }));
    },
    async existingKeys(mes, anio) {
      const { data } = await supabase
        .from("budget_items")
        .select("categoria, concepto")
        .eq("space_id", space.id)
        .eq("mes", mes)
        .eq("anio", anio);
      return new Set(
        (data ?? []).map((r) =>
          dupKey(String(r.categoria ?? ""), String(r.concepto ?? "")),
        ),
      );
    },
    async insertItems(rows, mes, anio) {
      if (rows.length === 0) return 0;
      const { data: existing } = await supabase
        .from("budget_items")
        .select("categoria, orden")
        .eq("space_id", space.id)
        .eq("mes", mes)
        .eq("anio", anio);
      const maxByCat = maxOrdenPorCategoria(existing ?? []);
      const payload = rows.map((r) => {
        const next = (maxByCat.get(r.categoria) ?? -1) + 1;
        maxByCat.set(r.categoria, next);
        return {
          space_id: space.id,
          categoria: r.categoria,
          concepto: r.concepto,
          monto: r.monto,
          moneda: r.moneda,
          automatico: false,
          recurrente: r.recurrente,
          orden: next,
          mes,
          anio,
          created_by: user.id,
        };
      });
      const { error } = await supabase.from("budget_items").insert(payload);
      if (error) throw new Error(error.message);
      return payload.length;
    },
  };
}
