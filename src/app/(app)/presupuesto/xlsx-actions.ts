"use server";

import { revalidatePath } from "next/cache";
import { tFor } from "@/lib/i18n";
import { getScopeContext, type BudgetScope, type CommitRow } from "@/lib/budget-io";
import { parseBudgetWorkbook, dupKey, type PreviewRow } from "@/lib/xlsx-budget";
import { MONEDAS } from "@/lib/types";

/** Códigos de moneda que la app entiende ("CRC", "USD"). */
const MONEDA_CODES = MONEDAS.map((m) => m.code) as string[];

/**
 * Importación de líneas del Presupuesto (personal y familiar) desde `.xlsx`.
 * `previewBudgetImport` lee y valida el archivo SIN guardar nada; el cliente
 * muestra la vista previa y, si el usuario confirma, llama a
 * `commitBudgetImport`, que inserta cada fila como una línea NUEVA en el mes que
 * se está viendo (nunca reemplaza ni empareja con líneas existentes).
 */

export type ImportPreview = {
  ok: boolean;
  rows: PreviewRow[];
  total: number;
  validos: number;
  invalidos: number;
  error?: string;
};

function toScope(v: FormDataEntryValue | null | undefined): BudgetScope {
  return v === "family" ? "family" : "personal";
}

export async function previewBudgetImport(
  formData: FormData,
): Promise<ImportPreview> {
  const scope = toScope(formData.get("scope"));
  const empty: ImportPreview = {
    ok: false,
    rows: [],
    total: 0,
    validos: 0,
    invalidos: 0,
  };

  const ctx = await getScopeContext(scope);
  if (!ctx) return { ...empty, error: "no-scope" };
  const t = tFor(ctx.locale);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ...empty, error: t("xlsx.errNoFile") };
  }

  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));
  const existentes =
    mes >= 1 && mes <= 12 && anio >= 2000
      ? await ctx.existingKeys(mes, anio)
      : new Set<string>();

  let rows: PreviewRow[];
  try {
    rows = await parseBudgetWorkbook(await file.arrayBuffer(), {
      categoriasValidas: ctx.categoriaNames,
      // Se aceptan las dos monedas de la app aunque el ámbito tenga sólo una
      // activa (p. ej. gastos en USD que vienen de una exportación).
      monedasValidas: MONEDA_CODES,
      monedaPorDefecto: ctx.monedaPrimaria,
      resolveCategoria: ctx.resolveCategoria,
      existentes,
      labels: {
        missingCategoria: t("xlsx.errRowCategoriaMissing"),
        badCategoria: t("xlsx.errRowCategoriaInvalid"),
        missingConcepto: t("xlsx.errRowConceptoMissing"),
        badMonto: t("xlsx.errRowMontoInvalid"),
        badMoneda: t("xlsx.errRowMonedaInvalid"),
        duplicado: t("xlsx.errRowDuplicate"),
      },
    });
  } catch {
    return { ...empty, error: t("xlsx.errParse") };
  }

  const validos = rows.filter((r) => r.ok).length;
  return {
    ok: true,
    rows,
    total: rows.length,
    validos,
    invalidos: rows.length - validos,
  };
}

export type CommitInput = {
  scope: BudgetScope;
  mes: number;
  anio: number;
  rows: {
    categoria: string;
    concepto: string;
    monto: number;
    moneda: string;
    recurrente: boolean;
  }[];
};

export async function commitBudgetImport(
  input: CommitInput,
): Promise<{ ok: boolean; inserted: number; error?: string }> {
  const scope = toScope(input?.scope);
  const mes = Number(input?.mes);
  const anio = Number(input?.anio);

  if (!mes || !anio || !Array.isArray(input?.rows) || input.rows.length === 0) {
    return { ok: false, inserted: 0, error: "bad-input" };
  }

  const ctx = await getScopeContext(scope);
  if (!ctx) return { ok: false, inserted: 0, error: "no-scope" };

  // Se revalida contra la lista de categorías de confianza del servidor y se
  // vuelven a descartar los repetidos — nunca se confía en lo que manda el
  // cliente.
  const existentes = await ctx.existingKeys(mes, anio);
  const vistos = new Set<string>();
  const clean: CommitRow[] = [];
  for (const r of input.rows) {
    const cat = ctx.resolveCategoria(String(r?.categoria ?? ""));
    const concepto = String(r?.concepto ?? "").trim();
    const monto = Number(r?.monto);
    const rawMon = String(r?.moneda ?? "").toUpperCase();
    const moneda = MONEDA_CODES.includes(rawMon) ? rawMon : ctx.monedaPrimaria;
    if (!cat || !concepto || !(monto > 0)) continue;

    const k = dupKey(cat.key, concepto);
    if (existentes.has(k) || vistos.has(k)) continue;
    vistos.add(k);

    clean.push({
      categoria: cat.key,
      concepto,
      monto,
      moneda,
      recurrente: Boolean(r?.recurrente),
    });
  }

  if (clean.length === 0) {
    return { ok: false, inserted: 0, error: "no-valid-rows" };
  }

  let inserted = 0;
  try {
    inserted = await ctx.insertItems(clean, mes, anio);
  } catch (e) {
    return {
      ok: false,
      inserted: 0,
      error: e instanceof Error ? e.message : "insert-failed",
    };
  }

  revalidatePath(scope === "family" ? "/familiar" : "/presupuesto");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  return { ok: true, inserted };
}
