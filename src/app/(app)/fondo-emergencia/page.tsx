import { getPersonalContext } from "@/lib/data";
import { calcularTotales, calcularFondoEmergencia, formatoMoneda, formatoPct } from "@/lib/calculations";
import { convertirBudgetItems, convertirDeudas, simbolo } from "@/lib/currency";
import type { BudgetItem, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Semaforo";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateFondoAcumulado } from "./actions";

export default async function FondoEmergenciaPage() {
  const { supabase, space, currency } = await getPersonalContext();
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("space_id", space.id)
      .eq("mes", mes)
      .eq("anio", anio),
    supabase.from("deudas").select("*").eq("space_id", space.id),
  ]);

  const itemsPrim = convertirBudgetItems((items ?? []) as BudgetItem[], currency);
  const deudasPrim = convertirDeudas((deudas ?? []) as Deuda[], currency);
  const t = calcularTotales(itemsPrim, deudasPrim, mes, anio);
  const fondo = calcularFondoEmergencia(t, 0, space);
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);

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
            <Field label={`Monto actual en tu fondo (${simbolo(currency.primaria)})`}>
              <Input
                type="number"
                step="0.01"
                name="fondo_acumulado"
                defaultValue={space.fondo_acumulado}
              />
            </Field>
            <Button type="submit" variant="secondary">
              Guardar
            </Button>
          </form>
          <p className="text-2xl font-semibold text-navy">
            {fmt(space.fondo_acumulado)}
          </p>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Fondo Básico ({space.meses_fondo_basico} {space.meses_fondo_basico === 1 ? "mes" : "meses"})
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-2">
              Meta: {fmt(fondo.metaBasico)}
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
              Fondo Ideal ({space.meses_fondo_ideal} meses)
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-2">
              Meta: {fmt(fondo.metaIdeal)}
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
            <p className="font-medium text-navy">{fmt(fondo.gastoMensualReal)}</p>
          </div>
          <div>
            <p className="text-gray-500">Ahorro Mensual Disponible (Ahorro + Inversión)</p>
            <p className="font-medium text-navy">{fmt(fondo.ahorroMensualDisponible)}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
