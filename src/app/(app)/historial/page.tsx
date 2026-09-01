import { getHouseholdContext } from "@/lib/data";
import { calcularTotales, formatoColones, formatoPct, MESES_LABEL } from "@/lib/calculations";
import type { BudgetItem, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { BalanceChart } from "@/components/charts/BalanceChart";

export default async function HistorialPage() {
  const { supabase, household } = await getHouseholdContext();

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("household_id", household.id)
      .order("anio", { ascending: true })
      .order("mes", { ascending: true }),
    supabase.from("deudas").select("*").eq("household_id", household.id),
  ]);

  const budgetItems = (items ?? []) as BudgetItem[];
  const deudasList = (deudas ?? []) as Deuda[];

  const clave = (mes: number, anio: number) => `${anio}-${mes}`;
  const mesesSet = new Map<string, { mes: number; anio: number }>();
  budgetItems.forEach((i) => mesesSet.set(clave(i.mes, i.anio), { mes: i.mes, anio: i.anio }));

  const meses = Array.from(mesesSet.values()).sort((a, b) =>
    a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes,
  );

  const filas = meses.map(({ mes, anio }) => {
    const t = calcularTotales(budgetItems, deudasList, mes, anio);
    return { mes, anio, ...t };
  });

  const chartData = filas.map((f) => ({
    label: `${MESES_LABEL[f.mes - 1].slice(0, 3)} ${String(f.anio).slice(2)}`,
    balance: Math.round(f.balance),
  }));

  return (
    <div>
      <PageHeader
        title="Historial Mensual y Tendencias"
        description="Registro histórico y evolución de tu balance."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Evolución del Balance</CardTitle>
        </CardHeader>
        <CardBody>
          {chartData.length > 0 ? (
            <BalanceChart data={chartData} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">
              Aún no hay suficientes meses registrados para mostrar la tendencia.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro Mensual</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                <th className="py-2 pr-3">Mes</th>
                <th className="py-2 pr-3">Ingreso Disp.</th>
                <th className="py-2 pr-3">Gastos</th>
                <th className="py-2 pr-3">Ahorros</th>
                <th className="py-2 pr-3">Inversión</th>
                <th className="py-2 pr-3">Donativos</th>
                <th className="py-2 pr-3">Formación</th>
                <th className="py-2 pr-3">Jugar</th>
                <th className="py-2 pr-3">Deuda</th>
                <th className="py-2 pr-3">Balance</th>
                <th className="py-2 pr-3">% Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {[...filas].reverse().map((f) => (
                <tr key={clave(f.mes, f.anio)} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-navy">
                    {MESES_LABEL[f.mes - 1]} {f.anio}
                  </td>
                  <td className="py-2 pr-3">{formatoColones(f.ingresoDisponible)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.gastos)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.ahorros)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.inversion)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.donativos)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.formacion)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.jugar)}</td>
                  <td className="py-2 pr-3">{formatoColones(f.deuda)}</td>
                  <td className={`py-2 pr-3 font-medium ${f.balance >= 0 ? "text-green" : "text-red"}`}>
                    {formatoColones(f.balance)}
                  </td>
                  <td className="py-2 pr-3">
                    {formatoPct(f.ingresoDisponible ? f.ahorros / f.ingresoDisponible : 0)}
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-400">
                    Registra movimientos en Presupuesto para empezar a construir tu historial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">
            Nota: la columna &quot;Deuda&quot; usa las cuotas activas actuales de tu Plan de
            Deudas — el módulo de deudas todavía no guarda un histórico propio por mes.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
