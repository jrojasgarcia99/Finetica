import { getPersonalContext } from "@/lib/data";
import { simularSnowball, formatoMoneda } from "@/lib/calculations";
import { convertirDeudas, simbolo } from "@/lib/currency";
import { tFor } from "@/lib/i18n";
import type { Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { MonedaSelect } from "@/components/ui/MontoConMoneda";
import { DeudaRow } from "@/components/deudas/DeudaRow";
import { addDeuda, updateDeuda, deleteDeuda, toggleEstadoDeuda, updatePagoExtraBase } from "./actions";

export default async function DeudasPage() {
  const { supabase, space, currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  const { data: deudas } = await supabase
    .from("deudas")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: true });

  const deudasRaw = (deudas ?? []) as Deuda[];
  const rawById = new Map(deudasRaw.map((d) => [d.id, d]));

  const deudasPrim = convertirDeudas(deudasRaw, currency);
  const activas = deudasPrim.filter((d) => d.estado === "Activa" && d.saldo_actual > 0);
  const resultado = simularSnowball(activas, space.pago_extra_base);

  const totalSaldo = activas.reduce((a, d) => a + Number(d.saldo_actual), 0);
  const totalCuota = activas.reduce((a, d) => a + Number(d.cuota_minima), 0);
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);
  const dosMonedas = currency.activas.length > 1;
  const pagadas = deudasRaw.filter((d) => d.estado === "Pagada");

  return (
    <div>
      <PageHeader title={t("deudas.title")} description={t("deudas.desc")} />

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
          <CardTitle>{t("deudas.registerNew")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addDeuda} className="grid sm:grid-cols-3 gap-3">
            <Field label={t("deudas.name")}>
              <Input name="nombre" required />
            </Field>
            <Field label={t("deudas.institution")}>
              <Input name="institucion" />
            </Field>
            <Field label={t("deudas.startDate")}>
              <Input type="date" name="fecha_inicio" />
            </Field>
            {dosMonedas ? (
              <Field label={t("common.currency")}>
                <MonedaSelect activas={currency.activas} primaria={currency.primaria} className="w-full" />
              </Field>
            ) : (
              <MonedaSelect activas={currency.activas} primaria={currency.primaria} />
            )}
            <Field label={t("deudas.originalAmount")}>
              <Input type="number" step="0.01" name="monto_original" required />
            </Field>
            <Field label={t("deudas.currentBalance")}>
              <Input type="number" step="0.01" name="saldo_actual" required />
            </Field>
            <Field label={t("deudas.annualRate")}>
              <Input type="number" step="0.01" name="tasa_interes_anual" required />
            </Field>
            <Field label={t("deudas.minInstallment")}>
              <Input type="number" step="0.01" name="cuota_minima" required />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit">{t("deudas.addDebt")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("deudas.yourDebts")}</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">{t("deudas.colName")}</th>
                <th className="py-2 pr-3">{t("deudas.colBalance")}</th>
                <th className="py-2 pr-3">{t("deudas.colRate")}</th>
                <th className="py-2 pr-3">{t("deudas.colMinInstallment")}</th>
                <th className="py-2 pr-3">{t("deudas.colStatus")}</th>
                <th className="py-2 pr-3"></th>
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
                  updateAction={updateDeuda}
                  deleteAction={deleteDeuda}
                  toggleAction={toggleEstadoDeuda}
                />
              ))}
              {deudasRaw.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">{t("deudas.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
