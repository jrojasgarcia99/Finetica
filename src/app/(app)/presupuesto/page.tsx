import { getHouseholdContext } from "@/lib/data";
import { calcularTotales, calcularSemaforos, formatoColones, formatoPct } from "@/lib/calculations";
import type { BudgetItem, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { CategoryCard } from "@/components/presupuesto/CategoryCard";
import { Card, CardBody } from "@/components/ui/Card";

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const { supabase, household } = await getHouseholdContext();
  const now = new Date();
  const sp = await searchParams;
  const mes = Number(sp.mes) || now.getMonth() + 1;
  const anio = Number(sp.anio) || now.getFullYear();

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("household_id", household.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .order("created_at", { ascending: true }),
    supabase.from("deudas").select("*").eq("household_id", household.id),
  ]);

  const budgetItems = (items ?? []) as BudgetItem[];
  const deudasList = (deudas ?? []) as Deuda[];
  const t = calcularTotales(budgetItems, deudasList, mes, anio);
  const semaforos = calcularSemaforos(t, household);
  const byKey = Object.fromEntries(semaforos.map((s) => [s.key, s]));

  const itemsOf = (cat: string) =>
    budgetItems
      .filter((i) => i.categoria === cat)
      .map((i) => ({ id: i.id, concepto: i.concepto, monto: Number(i.monto) }));

  return (
    <div>
      <PageHeader
        title="Presupuesto Personal y Familiar"
        description="Ingresos, rebajos, gastos, ahorro, inversión, donativos, formación, jugar y balance."
        action={<MonthSwitcher mes={mes} anio={anio} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Ingreso Disponible</p>
          <p className="text-xl font-semibold text-navy">{formatoColones(t.ingresoDisponible)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Deuda (cuotas)</p>
          <p className="text-xl font-semibold text-red">{formatoColones(t.deuda)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Balance</p>
          <p className={`text-xl font-semibold ${t.balance >= 0 ? "text-green" : "text-red"}`}>
            {formatoColones(t.balance)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">% Balance / Ingreso</p>
          <p className="text-xl font-semibold text-navy">
            {formatoPct(t.ingresoDisponible ? t.balance / t.ingresoDisponible : 0)}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CategoryCard
          categoria="ingresos"
          label="① Ingresos Netos"
          items={itemsOf("ingresos")}
          total={t.ingresos}
          mes={mes}
          anio={anio}
        />
        <CategoryCard
          categoria="rebajos"
          label="② Rebajos (deducciones de planilla)"
          items={itemsOf("rebajos")}
          total={t.rebajos}
          mes={mes}
          anio={anio}
        />
        <CategoryCard
          categoria="gastos"
          label="④ Gastos"
          items={itemsOf("gastos")}
          total={t.gastos}
          mes={mes}
          anio={anio}
          meta={byKey.gastos.meta}
          pct={byKey.gastos.pct}
          semaforo={byKey.gastos.semaforo}
          metaLabel={`Meta ≤ ${formatoPct(byKey.gastos.meta)}`}
        />
        <CategoryCard
          categoria="ahorros"
          label="⑤ Ahorros"
          items={itemsOf("ahorros")}
          total={t.ahorros}
          mes={mes}
          anio={anio}
          meta={byKey.ahorros.meta}
          pct={byKey.ahorros.pct}
          semaforo={byKey.ahorros.semaforo}
          metaLabel={`Meta ≥ ${formatoPct(byKey.ahorros.meta)}`}
        />
        <CategoryCard
          categoria="inversion"
          label="⑥ Inversión"
          items={itemsOf("inversion")}
          total={t.inversion}
          mes={mes}
          anio={anio}
          meta={byKey.inversion.meta}
          pct={byKey.inversion.pct}
          semaforo={byKey.inversion.semaforo}
          metaLabel={`Meta ≥ ${formatoPct(byKey.inversion.meta)}`}
        />
        <CategoryCard
          categoria="jugar"
          label="⑦ Jugar"
          items={itemsOf("jugar")}
          total={t.jugar}
          mes={mes}
          anio={anio}
          meta={byKey.jugar.meta}
          pct={byKey.jugar.pct}
          semaforo={byKey.jugar.semaforo}
          metaLabel={`Meta ≤ ${formatoPct(byKey.jugar.meta)}`}
        />
        <CategoryCard
          categoria="donativos"
          label="⑨ Donativos"
          items={itemsOf("donativos")}
          total={t.donativos}
          mes={mes}
          anio={anio}
          meta={byKey.donativos.meta}
          pct={byKey.donativos.pct}
          semaforo={byKey.donativos.semaforo}
          metaLabel={`Meta ≥ ${formatoPct(byKey.donativos.meta)}`}
        />
        <CategoryCard
          categoria="formacion"
          label="⑩ Formación"
          items={itemsOf("formacion")}
          total={t.formacion}
          mes={mes}
          anio={anio}
          meta={byKey.formacion.meta}
          pct={byKey.formacion.pct}
          semaforo={byKey.formacion.semaforo}
          metaLabel={`Meta ≥ ${formatoPct(byKey.formacion.meta)}`}
        />
      </div>

      <Card className="mt-6">
        <CardBody className="text-sm text-gray-500">
          ⑧ <strong className="text-gray-700">Deuda</strong> se calcula automáticamente a partir
          de las cuotas mínimas de tus deudas activas — edítalas en{" "}
          <a href="/deudas" className="text-navy-light hover:underline">
            Plan de Deudas
          </a>
          .
        </CardBody>
      </Card>
    </div>
  );
}
