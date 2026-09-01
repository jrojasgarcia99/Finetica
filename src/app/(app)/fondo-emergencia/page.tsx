import { getPersonalContext, getFamilyRepartoContext } from "@/lib/data";
import { calcularTotales, calcularFondoEmergencia, formatoMoneda, formatoPct } from "@/lib/calculations";
import { convertirBudgetItems, convertirDeudas, simbolo } from "@/lib/currency";
import { tFor } from "@/lib/i18n";
import type { BudgetItem, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Semaforo";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateFondoAcumulado } from "./actions";

export default async function FondoEmergenciaPage() {
  const { supabase, space, currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase.from("budget_items").select("*").eq("space_id", space.id).eq("mes", mes).eq("anio", anio),
    supabase.from("deudas").select("*").eq("space_id", space.id),
  ]);

  const reparto = await getFamilyRepartoContext(currency);
  const aporteFamiliar = reparto ? reparto.shareFor(mes, anio) : 0;

  const itemsPrim = convertirBudgetItems((items ?? []) as BudgetItem[], currency);
  const deudasPrim = convertirDeudas((deudas ?? []) as Deuda[], currency);
  const tot = calcularTotales(itemsPrim, deudasPrim, mes, anio, aporteFamiliar);
  const fondo = calcularFondoEmergencia(tot, 0, space);
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);
  const unit = (n: number) => (n === 1 ? t("common.month") : t("common.months"));

  return (
    <div>
      <PageHeader title={t("fondo.title")} description={t("fondo.desc")} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("fondo.accumulated")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateFondoAcumulado} className="flex items-end gap-2 max-w-xs mb-2">
            <Field label={t("fondo.currentAmountLabel", { sym: simbolo(currency.primaria) })}>
              <Input type="number" step="0.01" name="fondo_acumulado" defaultValue={space.fondo_acumulado} />
            </Field>
            <Button type="submit" variant="secondary">
              {t("common.save")}
            </Button>
          </form>
          <p className="text-2xl font-semibold text-navy">{fmt(space.fondo_acumulado)}</p>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("fondo.basicFund", {
                n: space.meses_fondo_basico,
                unit: unit(space.meses_fondo_basico),
              })}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-2">{t("fondo.goal", { amount: fmt(fondo.metaBasico) })}</p>
            <ProgressBar value={fondo.pctBasico} />
            <p className="text-sm mt-2 font-medium">{t("fondo.completed", { pct: formatoPct(fondo.pctBasico) })}</p>
            {fondo.mesesBasico !== null && fondo.pctBasico < 1 && (
              <p className="text-xs text-gray-400 mt-1">
                {t("fondo.atCurrentRate", { n: fondo.mesesBasico })}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fondo.idealFund", { n: space.meses_fondo_ideal })}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-2">{t("fondo.goal", { amount: fmt(fondo.metaIdeal) })}</p>
            <ProgressBar value={fondo.pctIdeal} color="var(--gold)" />
            <p className="text-sm mt-2 font-medium">{t("fondo.completed", { pct: formatoPct(fondo.pctIdeal) })}</p>
            {fondo.mesesIdeal !== null && fondo.pctIdeal < 1 && (
              <p className="text-xs text-gray-400 mt-1">
                {t("fondo.atCurrentRate", { n: fondo.mesesIdeal })}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{t("fondo.realMonthlyExpense")}</p>
            <p className="font-medium text-navy">{fmt(fondo.gastoMensualReal)}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("fondo.availableMonthlySaving")}</p>
            <p className="font-medium text-navy">{fmt(fondo.ahorroMensualDisponible)}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
