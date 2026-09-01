import { getHouseholdContext } from "@/lib/data";
import { calcularTotales, calcularFondoEmergencia, formatoColones, formatoPct } from "@/lib/calculations";
import type { BudgetItem, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Semaforo";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateFondoAcumulado } from "./actions";

export default async function FondoEmergenciaPage() {
  const { supabase, household } = await getHouseholdContext();
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("household_id", household.id)
      .eq("mes", mes)
      .eq("anio", anio),
    supabase.from("deudas").select("*").eq("household_id", household.id),
  ]);

  const t = calcularTotales((items ?? []) as BudgetItem[], (deudas ?? []) as Deuda[], mes, anio);
  const fondo = calcularFondoEmergencia(t, 0, household);

  return (
    <div>
      <PageHeader
        title="Fondo de Libertad Financiera"
        description="Tu colchón de emergencia — la base antes de construir hacia arriba."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monto Acumulado</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateFondoAcumulado} className="flex items-end gap-2 max-w-xs mb-2">
            <Field label="Monto actual en tu fondo (₡)">
              <Input
                type="number"
                step="0.01"
                name="fondo_acumulado"
                defaultValue={household.fondo_acumulado}
              />
            </Field>
            <Button type="submit" variant="secondary">
              Guardar
            </Button>
          </form>
          <p className="text-2xl font-semibold text-navy">
            {formatoColones(household.fondo_acumulado)}
          </p>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Fondo Básico ({household.meses_fondo_basico} {household.meses_fondo_basico === 1 ? "mes" : "meses"})
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-2">
              Meta: {formatoColones(fondo.metaBasico)}
            </p>
            <ProgressBar value={fondo.pctBasico} />
            <p className="text-sm mt-2 font-medium">{formatoPct(fondo.pctBasico)} completado</p>
            {fondo.mesesBasico !== null && fondo.pctBasico < 1 && (
              <p className="text-xs text-gray-400 mt-1">
                A tu ritmo actual de ahorro, {fondo.mesesBasico} mes(es) para completarlo.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Fondo Ideal ({household.meses_fondo_ideal} meses)
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-2">
              Meta: {formatoColones(fondo.metaIdeal)}
            </p>
            <ProgressBar value={fondo.pctIdeal} color="var(--gold)" />
            <p className="text-sm mt-2 font-medium">{formatoPct(fondo.pctIdeal)} completado</p>
            {fondo.mesesIdeal !== null && fondo.pctIdeal < 1 && (
              <p className="text-xs text-gray-400 mt-1">
                A tu ritmo actual de ahorro, {fondo.mesesIdeal} mes(es) para completarlo.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Gasto Mensual Real (Gastos + Deuda)</p>
            <p className="font-medium text-navy">{formatoColones(fondo.gastoMensualReal)}</p>
          </div>
          <div>
            <p className="text-gray-500">Ahorro Mensual Disponible (Ahorro + Inversión)</p>
            <p className="font-medium text-navy">{formatoColones(fondo.ahorroMensualDisponible)}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
