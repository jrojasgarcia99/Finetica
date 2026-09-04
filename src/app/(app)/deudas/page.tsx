import Link from "next/link";
import { Plus } from "lucide-react";
import { getPersonalContext } from "@/lib/data";
import { simularSnowball, formatoMoneda } from "@/lib/calculations";
import { convertirDeudas, aPrimaria, simbolo } from "@/lib/currency";
import { tFor, mesesLabel } from "@/lib/i18n";
import type { Deuda, Moneda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { DeudaRow } from "@/components/deudas/DeudaRow";
import { DeudaCharts, type DebtChartPoint } from "@/components/deudas/DeudaCharts";
import { InfoHint } from "@/components/ui/Tooltip";
import { updateDeuda, deleteDeuda, toggleEstadoDeuda, updatePagoExtraBase } from "./actions";

type DebtPaymentRow = {
  deuda_id: string;
  anio: number;
  mes: number;
  interes: number;
  capital: number;
  saldo_resultante: number;
  moneda: Moneda;
};

const CHART_MAX = 48;

export default async function DeudasPage() {
  const { supabase, space, currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  const MES = mesesLabel(locale);

  const [{ data: deudas }, { data: pagos }] = await Promise.all([
    supabase.from("deudas").select("*").eq("space_id", space.id).order("created_at", { ascending: true }),
    supabase
      .from("debt_payments")
      .select("deuda_id, anio, mes, interes, capital, saldo_resultante, moneda")
      .eq("space_id", space.id)
      .order("anio", { ascending: true })
      .order("mes", { ascending: true }),
  ]);

  const deudasRaw = (deudas ?? []) as Deuda[];
  const rawById = new Map(deudasRaw.map((d) => [d.id, d]));
  const pagosRows = (pagos ?? []) as DebtPaymentRow[];

  const deudasPrim = convertirDeudas(deudasRaw, currency);
  const activas = deudasPrim.filter((d) => d.estado === "Activa" && d.saldo_actual > 0);
  const resultado = simularSnowball(activas, Number(space.pago_extra_base) || 0);

  const totalSaldo = activas.reduce((a, d) => a + Number(d.saldo_actual), 0);
  const totalCuota = activas.reduce((a, d) => a + Number(d.cuota_minima), 0);
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);
  const pagadas = deudasRaw.filter((d) => d.estado === "Pagada");
  const toP = (v: number, m: Moneda) => aPrimaria(Number(v) || 0, m, currency);
  const lbl = (y: number, m: number) => `${MES[m - 1].slice(0, 3)} ${String(y).slice(2)}`;
  const addMonths = (y: number, m: number, add: number) => {
    const idx = (y * 12 + (m - 1)) + add;
    return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
  };

  // ---- historial (debt_payments agrupado por mes, en moneda primaria) --------
  const histMap = new Map<string, { anio: number; mes: number; interes: number; capital: number; saldoFin: number }>();
  for (const p of pagosRows) {
    const k = `${p.anio}-${p.mes}`;
    const cur = histMap.get(k) ?? { anio: p.anio, mes: p.mes, interes: 0, capital: 0, saldoFin: 0 };
    cur.interes += toP(p.interes, p.moneda);
    cur.capital += toP(p.capital, p.moneda);
    cur.saldoFin += toP(p.saldo_resultante, p.moneda);
    histMap.set(k, cur);
  }
  const histRows = [...histMap.values()].sort((a, b) => a.anio * 12 + a.mes - (b.anio * 12 + b.mes));

  // interés/capital acumulado por deuda
  const histByDebt = new Map<string, { interes: number; capital: number }>();
  for (const p of pagosRows) {
    const cur = histByDebt.get(p.deuda_id) ?? { interes: 0, capital: 0 };
    cur.interes += toP(p.interes, p.moneda);
    cur.capital += toP(p.capital, p.moneda);
    histByDebt.set(p.deuda_id, cur);
  }

  // ---- proyección: mes de arranque = mes siguiente al último con historial ---
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  let projStart = { y: curY, m: curM };
  if (histRows.length) {
    const last = histRows[histRows.length - 1];
    projStart = addMonths(last.anio, last.mes, 1);
  }

  const proj = resultado.meses.slice(0, CHART_MAX).map((mm, i) => {
    const { y, m } = addMonths(projStart.y, projStart.m, i);
    return {
      label: lbl(y, m),
      saldo: mm.totalSaldo,
      interes: mm.interesDelMes,
      capital: mm.capitalDelMes,
      tipo: "proj" as const,
    };
  });
  const histChart = histRows.map((h) => ({
    label: lbl(h.anio, h.mes),
    saldo: h.saldoFin,
    interes: h.interes,
    capital: h.capital,
    tipo: "hist" as const,
  }));
  const series = [...histChart, ...proj];
  // que la línea arranque en el saldo actual si no hay historial
  const chartData: DebtChartPoint[] =
    histChart.length === 0 && series.length > 0
      ? [{ label: lbl(curY, curM), saldo: totalSaldo, interes: 0, capital: 0 }, ...series]
      : series;

  // ---- resumen por deuda ---------------------------------------------------
  const mesFinByDebt = new Map<string, number | null>();
  resultado.orden.forEach((d, k) => mesFinByDebt.set(d.id, resultado.mesLiquidacionPorDeuda[k] ?? null));

  const resumenById = new Map(
    deudasRaw.map((d) => {
      const montoOrig = toP(d.monto_original, d.moneda);
      const saldoNow = toP(d.saldo_actual, d.moneda);
      const pagado = Math.max(montoOrig - saldoNow, 0);
      const pctPagado = montoOrig > 0 ? pagado / montoOrig : d.estado === "Pagada" ? 1 : 0;
      const h = histByDebt.get(d.id) ?? { interes: 0, capital: 0 };
      const finN = mesFinByDebt.get(d.id) ?? null;
      let mesFin: string | null = null;
      if (d.estado === "Pagada") mesFin = "—";
      else if (finN != null) {
        const { y, m } = addMonths(projStart.y, projStart.m, finN - 1);
        mesFin = `${MES[m - 1].slice(0, 3)} ${y}`;
      }
      return [d.id, { pagado, pctPagado, interesPagado: h.interes, mesFin }] as const;
    }),
  );

  return (
    <div>
      <PageHeader
        title={t("deudas.title")}
        action={
          <Link
            href="/deudas/nueva"
            aria-label={t("deudas.addDebt")}
            className="grid h-10 w-10 place-items-center rounded-full bg-navy text-white transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={22} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t("deudas.totalBalance")} value={fmt(totalSaldo)} accent="red" />
        <KpiCard label={t("deudas.monthlyInstallments")} value={fmt(totalCuota)} />
        <KpiCard
          label={t("deudas.monthsToFreedom")}
          value={resultado.mesesParaLibertad !== null ? String(resultado.mesesParaLibertad) : t("deudas.over20y")}
          accent="gold"
          hint={t("tip.mesesLibertad")}
        />
        <KpiCard
          label={t("deudas.interestSaved")}
          value={fmt(resultado.ahorroEnIntereses)}
          accent="green"
          hint={t("tip.ahorroIntereses")}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            {t("deudas.chartSplitTitle")}
            <InfoHint content={t("tip.chartSplit")} />
          </CardTitle>
        </CardHeader>
        <CardBody>
          <DeudaCharts data={chartData} moneda={currency.primaria} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("deudas.extraPaymentTitle")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updatePagoExtraBase} className="flex items-end gap-2 max-w-xs">
            <Field label={t("deudas.extraPaymentLabel", { sym: simbolo(currency.primaria) })} hint={t("tip.pagoExtra")}>
              <Input type="number" name="pago_extra_base" defaultValue={space.pago_extra_base} step="0.01" />
            </Field>
            <Button type="submit" variant="secondary">
              {t("common.save")}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("deudas.yourDebts")}</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">{t("deudas.colName")}</th>
                <th className="py-2 pr-3">{t("deudas.colBalance")}</th>
                <th className="py-2 pr-3">{t("deudas.colPaid")}</th>
                <th className="py-2 pr-3">{t("deudas.colInterestPaid")}</th>
                <th className="py-2 pr-3">{t("deudas.colRate")}</th>
                <th className="py-2 pr-3">{t("deudas.colMinInstallment")}</th>
                <th className="py-2 pr-3">{t("deudas.colEndsMonth")}</th>
                <th className="py-2 pr-3">{t("deudas.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {resultado.orden.map((d, i) => {
                const raw = rawById.get(d.id);
                if (!raw) return null;
                return (
                  <DeudaRow
                    key={d.id}
                    deuda={raw}
                    currency={currency}
                    rank={i + 1}
                    resumen={resumenById.get(d.id)}
                    updateAction={updateDeuda}
                    deleteAction={deleteDeuda}
                    toggleAction={toggleEstadoDeuda}
                  />
                );
              })}
              {pagadas.map((d) => (
                <DeudaRow
                  key={d.id}
                  deuda={d}
                  currency={currency}
                  rank={null}
                  paid
                  resumen={resumenById.get(d.id)}
                  updateAction={updateDeuda}
                  deleteAction={deleteDeuda}
                  toggleAction={toggleEstadoDeuda}
                />
              ))}
              {deudasRaw.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-400">{t("deudas.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardBody>
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-navy-light hover:underline">
                {t("deudas.monthByMonth")}
              </summary>
              <div className="mt-3 max-h-96 overflow-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                      <th className="py-2 pr-3">{t("historial.colMonth")}</th>
                      <th className="py-2 pr-3">{t("deudas.colTotalPayment")}</th>
                      <th className="py-2 pr-3">{t("deudas.interest")}</th>
                      <th className="py-2 pr-3">{t("deudas.principal")}</th>
                      <th className="py-2 pr-3">{t("deudas.colRemaining")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((r, idx) => (
                      <tr
                        key={`${r.label}-${idx}`}
                        className={`border-b border-border last:border-0 ${
                          r.tipo === "hist" ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="py-1.5 pr-3">
                          {r.label}
                          <span className="ml-1 text-[10px] text-gray-400">
                            {r.tipo === "hist" ? t("deudas.history") : t("deudas.projection")}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3">{fmt(r.interes + r.capital)}</td>
                        <td className="py-1.5 pr-3 text-red">{fmt(r.interes)}</td>
                        <td className="py-1.5 pr-3 text-green">{fmt(r.capital)}</td>
                        <td className="py-1.5 pr-3 font-medium">{fmt(r.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
