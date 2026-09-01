import Link from "next/link";
import { getPersonalContext, getFamilyRepartoContext, seedRecurringIfEmpty } from "@/lib/data";
import { calcularTotales, calcularSemaforos, formatoMoneda, formatoPct } from "@/lib/calculations";
import { convertirBudgetItems, convertirDeudas } from "@/lib/currency";
import { tFor } from "@/lib/i18n";
import type { BudgetItem, Categoria, Deuda } from "@/lib/types";
import { CATEGORIA_KEYS } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { BudgetBoard, type BudgetSection } from "@/components/presupuesto/BudgetBoard";
import { Card, CardBody } from "@/components/ui/Card";
import { addBudgetItem, updateBudgetItem, deleteBudgetItem, applyBudgetOrder } from "./actions";

const META_TIPO: Partial<Record<Categoria, "max" | "min">> = {
  gastos: "max",
  jugar: "max",
  ahorros: "min",
  inversion: "min",
  donativos: "min",
  formacion: "min",
};

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const { supabase, space, currency, locale, user } = await getPersonalContext();
  const t = tFor(locale);
  const now = new Date();
  const sp = await searchParams;
  const mes = Number(sp.mes) || now.getMonth() + 1;
  const anio = Number(sp.anio) || now.getFullYear();

  await seedRecurringIfEmpty({ kind: "personal", scopeId: space.id, userId: user.id, mes, anio });

  const [{ data: items }, { data: deudas }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("space_id", space.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("deudas").select("*").eq("space_id", space.id),
  ]);

  const budgetItems = (items ?? []) as BudgetItem[];
  const deudasList = (deudas ?? []) as Deuda[];

  const reparto = await getFamilyRepartoContext(currency);
  const aporteFamiliar = reparto ? reparto.shareFor(mes, anio) : 0;

  const itemsPrim = convertirBudgetItems(budgetItems, currency);
  const deudasPrim = convertirDeudas(deudasList, currency);
  const tot = calcularTotales(itemsPrim, deudasPrim, mes, anio, aporteFamiliar);
  const semaforos = calcularSemaforos(tot, space);
  const byKey = Object.fromEntries(semaforos.map((s) => [s.key, s]));
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);
  const totalOf: Record<Categoria, number> = {
    ingresos: tot.ingresos, rebajos: tot.rebajos, gastos: tot.gastos, ahorros: tot.ahorros,
    inversion: tot.inversion, jugar: tot.jugar, donativos: tot.donativos, formacion: tot.formacion,
  };

  const sections: BudgetSection[] = CATEGORIA_KEYS.map((cat) => {
    const sk = byKey[cat];
    return {
      categoria: cat,
      label: t(`categoria.${cat}` as `categoria.${Categoria}`),
      total: totalOf[cat],
      meta: sk?.meta,
      pct: sk?.pct,
      semaforo: sk?.semaforo,
      metaTipo: META_TIPO[cat],
      extraLine:
        cat === "gastos" && aporteFamiliar > 0
          ? {
              label: t("presupuesto.familyShareLine"),
              monto: aporteFamiliar,
              href: "/familiar",
            }
          : undefined,
      items: budgetItems
        .filter((i) => i.categoria === cat)
        .map((i) => ({
          id: i.id,
          concepto: i.concepto,
          monto: Number(i.monto),
          moneda: i.moneda,
          automatico: Boolean(i.automatico),
          recurrente: Boolean(i.recurrente),
        })),
    };
  });

  return (
    <div>
      <PageHeader
        title={t("presupuesto.title")}
        description={t("presupuesto.desc")}
        action={<MonthSwitcher mes={mes} anio={anio} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">{t("presupuesto.disposableIncome")}</p>
          <p className="text-xl font-semibold text-navy">{fmt(tot.ingresoDisponible)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">{t("presupuesto.debtInstallments")}</p>
          <p className="text-xl font-semibold text-red">{fmt(tot.deuda)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">{t("presupuesto.balance")}</p>
          <p className={`text-xl font-semibold ${tot.balance >= 0 ? "text-green" : "text-red"}`}>
            {fmt(tot.balance)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">{t("presupuesto.balanceOverIncome")}</p>
          <p className="text-xl font-semibold text-navy">
            {formatoPct(tot.ingresoDisponible ? tot.balance / tot.ingresoDisponible : 0)}
          </p>
        </Card>
      </div>

      <BudgetBoard
        sections={sections}
        currency={currency}
        mes={mes}
        anio={anio}
        addAction={addBudgetItem}
        updateAction={updateBudgetItem}
        deleteAction={deleteBudgetItem}
        applyOrder={applyBudgetOrder}
      />

      <Card className="mt-6">
        <CardBody className="text-sm text-gray-500">
          {t("presupuesto.debtNote")}{" "}
          <Link href="/deudas" className="text-navy-light hover:underline">
            {t("presupuesto.debtPlanLink")}
          </Link>
          .
        </CardBody>
      </Card>
    </div>
  );
}
