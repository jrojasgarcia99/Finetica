import type { NextRequest } from "next/server";
import { tFor } from "@/lib/i18n";
import { getScopeContext, type BudgetScope } from "@/lib/budget-io";
import { buildBudgetWorkbook, XLSX_MIME, type ExportRow } from "@/lib/xlsx-budget";

/**
 * Descarga de la plantilla en blanco y exportación del mes actual, en `.xlsx`
 * con listas desplegables (validación de datos) en Categoría, Moneda y
 * Recurrente. `?scope=personal|family` · `?mode=template|export` ·
 * (export) `?mes=&anio=`.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope: BudgetScope =
    searchParams.get("scope") === "family" ? "family" : "personal";
  const mode = searchParams.get("mode") === "export" ? "export" : "template";

  const ctx = await getScopeContext(scope);
  if (!ctx) return new Response("No autorizado", { status: 403 });
  const t = tFor(ctx.locale);

  const slug = scope === "family" ? "familiar" : "presupuesto";
  let rows: ExportRow[] = [];
  let filename = `plantilla-${slug}.xlsx`;

  if (mode === "export") {
    const mes = Number(searchParams.get("mes"));
    const anio = Number(searchParams.get("anio"));
    if (mes >= 1 && mes <= 12 && anio >= 2000 && anio <= 2100) {
      rows = await ctx.readMonth(mes, anio);
      filename = `${slug}-${anio}-${String(mes).padStart(2, "0")}.xlsx`;
    }
  }

  const buf = await buildBudgetWorkbook({
    sheetName: t("xlsx.sheetName"),
    headers: {
      categoria: t("xlsx.colCategoria"),
      concepto: t("xlsx.colConcepto"),
      monto: t("xlsx.colMonto"),
      moneda: t("xlsx.colMoneda"),
      recurrente: t("xlsx.colRecurrente"),
    },
    siNo: [t("xlsx.yes"), t("xlsx.no")],
    categorias: ctx.categoriaNames,
    monedas: ctx.monedasActivas,
    rows,
  });

  return new Response(buf, {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
