import { getPersonalContext } from "@/lib/data";
import { simularSnowball, formatoMoneda } from "@/lib/calculations";
import { convertirDeudas, simbolo } from "@/lib/currency";
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
  const { supabase, space, currency } = await getPersonalContext();
  const { data: deudas } = await supabase
    .from("deudas")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: true });

  const deudasRaw = (deudas ?? []) as Deuda[];
  const rawById = new Map(deudasRaw.map((d) => [d.id, d]));

  // Simulación y KPIs siempre en la moneda primaria.
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
      <PageHeader
        title="Plan de Deudas — Método Bola de Nieve"
        description="Ordena tus deudas de menor a mayor saldo y ataca la más pequeña primero."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Saldo Total" value={fmt(totalSaldo)} accent="red" />
        <KpiCard label="Cuotas Mensuales" value={fmt(totalCuota)} />
        <KpiCard
          label="Meses para Libertad"
          value={resultado.mesesParaLibertad !== null ? String(resultado.mesesParaLibertad) : "20+ años"}
          accent="gold"
        />
        <KpiCard
          label="Ahorro Estimado en Intereses"
          value={fmt(resultado.ahorroEnIntereses)}
          accent="green"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pago Extra Base Mensual</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updatePagoExtraBase} className="flex items-end gap-2 max-w-xs">
            <Field label={`Adicional a las cuotas mínimas (${simbolo(currency.primaria)})`}>
              <Input
                type="number"
                name="pago_extra_base"
                defaultValue={space.pago_extra_base}
                step="0.01"
              />
            </Field>
            <Button type="submit" variant="secondary">
              Guardar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registrar nueva deuda</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addDeuda} className="grid sm:grid-cols-3 gap-3">
            <Field label="Nombre">
              <Input name="nombre" required />
            </Field>
            <Field label="Institución">
              <Input name="institucion" />
            </Field>
            <Field label="Fecha de inicio">
              <Input type="date" name="fecha_inicio" />
            </Field>
            {dosMonedas ? (
              <Field label="Moneda">
                <MonedaSelect
                  activas={currency.activas}
                  primaria={currency.primaria}
                  className="w-full"
                />
              </Field>
            ) : (
              <MonedaSelect activas={currency.activas} primaria={currency.primaria} />
            )}
            <Field label="Monto original">
              <Input type="number" step="0.01" name="monto_original" required />
            </Field>
            <Field label="Saldo pendiente actual">
              <Input type="number" step="0.01" name="saldo_actual" required />
            </Field>
            <Field label="Tasa de interés anual (%)">
              <Input type="number" step="0.01" name="tasa_interes_anual" required />
            </Field>
            <Field label="Cuota mínima mensual">
              <Input type="number" step="0.01" name="cuota_minima" required />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit">Agregar deuda</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus deudas (ordenadas por prioridad)</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Saldo</th>
                <th className="py-2 pr-3">Tasa</th>
                <th className="py-2 pr-3">Cuota Mínima</th>
                <th className="py-2 pr-3">Estado</th>
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
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    Aún no has registrado deudas. ¡Buena señal, o es momento de empezar a
                    registrarlas para atacarlas con un plan!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
