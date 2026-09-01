import { getHouseholdContext } from "@/lib/data";
import { simularSnowball, formatoColones } from "@/lib/calculations";
import type { Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { addDeuda, deleteDeuda, toggleEstadoDeuda, updatePagoExtraBase } from "./actions";
import { Trash2 } from "lucide-react";

export default async function DeudasPage() {
  const { supabase, household } = await getHouseholdContext();
  const { data: deudas } = await supabase
    .from("deudas")
    .select("*")
    .eq("household_id", household.id)
    .order("created_at", { ascending: true });

  const deudasList = (deudas ?? []) as Deuda[];
  const activas = deudasList.filter((d) => d.estado === "Activa" && d.saldo_actual > 0);
  const resultado = simularSnowball(activas, household.pago_extra_base);

  const totalSaldo = activas.reduce((a, d) => a + Number(d.saldo_actual), 0);
  const totalCuota = activas.reduce((a, d) => a + Number(d.cuota_minima), 0);

  return (
    <div>
      <PageHeader
        title="Plan de Deudas — Método Bola de Nieve"
        description="Ordena tus deudas de menor a mayor saldo y ataca la más pequeña primero."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Saldo Total" value={formatoColones(totalSaldo)} accent="red" />
        <KpiCard label="Cuotas Mensuales" value={formatoColones(totalCuota)} />
        <KpiCard
          label="Meses para Libertad"
          value={resultado.mesesParaLibertad !== null ? String(resultado.mesesParaLibertad) : "20+ años"}
          accent="gold"
        />
        <KpiCard
          label="Ahorro Estimado en Intereses"
          value={formatoColones(resultado.ahorroEnIntereses)}
          accent="green"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pago Extra Base Mensual</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updatePagoExtraBase} className="flex items-end gap-2 max-w-xs">
            <Field label="Adicional a las cuotas mínimas (₡)">
              <Input
                type="number"
                name="pago_extra_base"
                defaultValue={household.pago_extra_base}
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
              {resultado.orden.map((d, i) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-navy">{i + 1}</td>
                  <td className="py-2 pr-3">
                    {d.nombre}
                    {d.institucion && <span className="text-gray-400"> · {d.institucion}</span>}
                  </td>
                  <td className="py-2 pr-3">{formatoColones(d.saldo_actual)}</td>
                  <td className="py-2 pr-3">{d.tasa_interes_anual}%</td>
                  <td className="py-2 pr-3">{formatoColones(d.cuota_minima)}</td>
                  <td className="py-2 pr-3">
                    <form action={toggleEstadoDeuda}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="estado" value={d.estado} />
                      <button
                        type="submit"
                        className="text-xs rounded-full px-2 py-1 bg-green/10 text-green font-medium"
                      >
                        {d.estado}
                      </button>
                    </form>
                  </td>
                  <td className="py-2 pr-3">
                    <form action={deleteDeuda}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="text-gray-300 hover:text-red" aria-label="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {deudasList
                .filter((d) => d.estado === "Pagada")
                .map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 opacity-50">
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3 line-through">{d.nombre}</td>
                    <td className="py-2 pr-3">{formatoColones(d.saldo_actual)}</td>
                    <td className="py-2 pr-3">{d.tasa_interes_anual}%</td>
                    <td className="py-2 pr-3">{formatoColones(d.cuota_minima)}</td>
                    <td className="py-2 pr-3">
                      <form action={toggleEstadoDeuda}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="estado" value={d.estado} />
                        <button
                          type="submit"
                          className="text-xs rounded-full px-2 py-1 bg-gray-200 text-gray-500 font-medium"
                        >
                          {d.estado}
                        </button>
                      </form>
                    </td>
                    <td className="py-2 pr-3">
                      <form action={deleteDeuda}>
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className="text-gray-300 hover:text-red" aria-label="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              {deudasList.length === 0 && (
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
