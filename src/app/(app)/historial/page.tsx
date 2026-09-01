import { getPersonalContext, getFamilyRepartoContext } from "@/lib/data";
import { calcularTotales, formatoMoneda, formatoPct } from "@/lib/calculations";
import { convertirBudgetItems, convertirDeudas } from "@/lib/currency";
import { tFor, mesesLabel } from "@/lib/i18n";
import type { BudgetItem, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { BalanceChart } from "@/components/charts/BalanceChart";

export default async function HistorialPage() {
  const { supabase, space, currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  const MESES = mesesLabel(locale);

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("space_id", space.id)
      .order("anio", { ascending: true })
      .order("mes", { ascending: true }),
    supabase.from("deudas").select("*").eq("space_id", space.id),
  ]);

  const budgetItems = convertirBudgetItems((items ?? []) as BudgetItem[], currency);
  const deudasList = convertirDeudas((deudas ?? []) as Deuda[], currency);
  const reparto = await getFamilyRepartoContext(currency);
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);

  const clave = (mes: number, anio: number) => `${anio}-${mes}`;
  const mesesSet = new Map<string, { mes: number; anio: number }>();
  budgetItems.forEach((i) => mesesSet.set(clave(i.mes, i.anio), { mes: i.mes, anio: i.anio }));
  const meses = Array.from(mesesSet.values()).sort((a, b) =>
    a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes,
  );

  const filas = meses.map(({ mes, anio }) => {
    const aporte = reparto ? reparto.shareFor(mes, anio) : 0;
    const tot = calcularTotales(budgetItems, deudasList, mes, anio, aporte);
    return { mes, anio, ...tot };
  });

  const chartData = filas.map((f) => ({
    label: `${MESES[f.mes - 1].slice(0, 3)} ${String(f.anio).slice(2)}`,
    balance: Math.round(f.balance),
  }));

  const cols = [
    "historial.colMonth", "historial.colDispIncome", "historial.colExpenses",
    "historial.colSavings", "historial.colInvestment", "historial.colDonations",
    "historial.colEducation", "historial.colPlay", "historial.colDebt",
    "historial.colBalance", "historial.colSavingPct",
  ] as const;

  return (
    <div>
      <PageHeader title={t("historial.title")} description={t("historial.desc")} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("historial.balanceEvolution")}</CardTitle>
        </CardHeader>
        <CardBody>
          {chartData.length > 0 ? (
            <BalanceChart data={chartData} moneda={currency.primaria} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">{t("historial.notEnoughMonths")}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("historial.monthlyRecord")}</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                {cols.map((c) => (
                  <th key={c} className="py-2 pr-3">{t(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filas].reverse().map((f) => (
                <tr key={clave(f.mes, f.anio)} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-navy">{MESES[f.mes - 1]} {f.anio}</td>
                  <td className="py-2 pr-3">{fmt(f.ingresoDisponible)}</td>
                  <td className="py-2 pr-3">{fmt(f.gastos)}</td>
                  <td className="py-2 pr-3">{fmt(f.ahorros)}</td>
                  <td className="py-2 pr-3">{fmt(f.inversion)}</td>
                  <td className="py-2 pr-3">{fmt(f.donativos)}</td>
                  <td className="py-2 pr-3">{fmt(f.formacion)}</td>
                  <td className="py-2 pr-3">{fmt(f.jugar)}</td>
                  <td className="py-2 pr-3">{fmt(f.deuda)}</td>
                  <td className={`py-2 pr-3 font-medium ${f.balance >= 0 ? "text-green" : "text-red"}`}>
                    {fmt(f.balance)}
                  </td>
                  <td className="py-2 pr-3">
                    {formatoPct(f.ingresoDisponible ? f.ahorros / f.ingresoDisponible : 0)}
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-400">{t("historial.emptyRow")}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">{t("historial.debtNote")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
