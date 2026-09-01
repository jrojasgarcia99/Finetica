import { getPersonalContext } from "@/lib/data";
import {
  calcularTotales,
  calcularSemaforos,
  saludFinancieraGeneral,
  calcularFondoEmergencia,
  formatoMoneda,
  formatoPct,
} from "@/lib/calculations";
import { convertirBudgetItems, convertirDeudas, aPrimaria } from "@/lib/currency";
import type { BudgetItem, Deuda, Activo, Pasivo } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SemaforoBadge, ProgressBar } from "@/components/ui/Semaforo";
import { SEMAFORO_COLOR } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const { supabase, space, currency } = await getPersonalContext();
  const now = new Date();
  const sp = await searchParams;
  const mes = Number(sp.mes) || now.getMonth() + 1;
  const anio = Number(sp.anio) || now.getFullYear();

  const [{ data: items }, { data: deudas }, { data: activos }, { data: pasivos }] =
    await Promise.all([
      supabase
        .from("budget_items")
        .select("*")
        .eq("space_id", space.id)
        .eq("mes", mes)
        .eq("anio", anio),
      supabase.from("deudas").select("*").eq("space_id", space.id),
      supabase.from("activos").select("*").eq("space_id", space.id),
      supabase.from("pasivos").select("*").eq("space_id", space.id),
    ]);

  const budgetItems = convertirBudgetItems((items ?? []) as BudgetItem[], currency);
  const deudasList = convertirDeudas((deudas ?? []) as Deuda[], currency);
  const activosList = (activos ?? []) as Activo[];
  const pasivosList = (pasivos ?? []) as Pasivo[];
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);

  const t = calcularTotales(budgetItems, deudasList, mes, anio);
  const semaforos = calcularSemaforos(t, space);

  const totalActivos = activosList.reduce((a, x) => a + aPrimaria(Number(x.valor), x.moneda, currency), 0);
  const totalPasivosVarios = pasivosList.reduce(
    (a, x) => a + aPrimaria(Number(x.valor), x.moneda, currency),
    0,
  );
  const saldoDeudas = deudasList
    .filter((d) => d.estado === "Activa")
    .reduce((a, d) => a + Number(d.saldo_actual), 0);
  const totalPasivos = totalPasivosVarios + saldoDeudas;
  const patrimonioNeto = totalActivos - totalPasivos;

  const fondo = calcularFondoEmergencia(t, 0, space);
  const salud = saludFinancieraGeneral(t, space, fondo.pctIdeal);

  const ingresoMensual = Number(space.salario_mensual);

  return (
    <div>
      <PageHeader
        title={`Hola, ${space.display_name || "bienvenido"}`}
        description="Tu panel ejecutivo — la vista consolidada de tu sistema financiero."
      />

      <Card className="mb-6 overflow-hidden">
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ backgroundColor: `${SEMAFORO_COLOR[salud.nivel]}14` }}
        >
          <SemaforoBadge nivel={salud.nivel} />
          <p className="text-sm text-gray-700">{salud.mensaje}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Ingreso Mensual" value={fmt(ingresoMensual)} />
        <KpiCard
          label="Ingreso Disponible"
          value={fmt(t.ingresoDisponible)}
          accent="navy"
        />
        <KpiCard
          label="Balance del Mes"
          value={fmt(t.balance)}
          accent={t.balance >= 0 ? "green" : "red"}
        />
        <KpiCard label="Patrimonio Neto" value={fmt(patrimonioNeto)} accent="gold" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Semáforo de Salud Financiera</CardTitle>
            <Link href="/presupuesto" className="text-xs text-navy-light hover:underline">
              Ver presupuesto →
            </Link>
          </CardHeader>
          <CardBody className="space-y-4">
            {semaforos.map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {formatoPct(s.pct)} · meta {formatoPct(s.meta)}
                    </span>
                    <SemaforoBadge nivel={s.semaforo} />
                  </div>
                </div>
                <ProgressBar value={s.pct} color={SEMAFORO_COLOR[s.semaforo]} />
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fondo de Emergencia</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Meta ideal (6 meses)</span>
                  <span className="font-medium">{formatoPct(fondo.pctIdeal)}</span>
                </div>
                <ProgressBar value={fondo.pctIdeal} color="var(--gold)" />
              </div>
              <p className="text-xs text-gray-500">
                {fmt(space.fondo_acumulado)} de {fmt(fondo.metaIdeal)}
              </p>
              <Link
                href="/fondo-emergencia"
                className="text-xs text-navy-light hover:underline block pt-1"
              >
                Ver detalle →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deuda Total</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-2xl font-semibold text-red">{fmt(saldoDeudas)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {deudasList.filter((d) => d.estado === "Activa").length} deuda(s) activa(s)
              </p>
              <Link href="/deudas" className="text-xs text-navy-light hover:underline block pt-2">
                Ver plan de deudas →
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
