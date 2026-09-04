import { getPersonalContext } from "@/lib/data";
import { tFor } from "@/lib/i18n";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { BackButton } from "@/components/ui/BackButton";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MonedaSelect } from "@/components/ui/MontoConMoneda";
import { addDeuda } from "../actions";

export default async function NuevaDeudaPage() {
  const { currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  const dosMonedas = currency.activas.length > 1;

  return (
    <div>
      <BackButton href="/deudas" label={t("deudas.back")} />

      <PageHeader title={t("deudas.registerNew")} />

      <Card>
        <CardBody>
          <form action={addDeuda} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("deudas.name")}>
              <Input name="nombre" required />
            </Field>
            <Field label={t("deudas.institution")}>
              <Input name="institucion" />
            </Field>
            <Field label={t("deudas.startDate")} className="sm:col-span-2">
              <Input type="date" name="fecha_inicio" className="max-w-[10rem]" />
            </Field>
            {dosMonedas ? (
              <Field label={t("common.currency")}>
                <MonedaSelect
                  activas={currency.activas}
                  primaria={currency.primaria}
                  className="w-full"
                />
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
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">
                {t("deudas.addDebt")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
