import Link from "next/link";
import { getFamilyBudgetContext } from "@/lib/data";
import { formatoMoneda, formatoPct } from "@/lib/calculations";
import { aPrimaria } from "@/lib/currency";
import type { FamilyBudgetCategory, FamilyBudgetItem, Moneda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ExchangeRateWidget } from "@/components/layout/ExchangeRateWidget";
import { FamilyCategoryCard } from "@/components/familiar/FamilyCategoryCard";
import {
  addFamilyItem,
  updateFamilyItem,
  deleteFamilyItem,
  addFamilyCategory,
  deleteFamilyCategory,
  updateFamilyTipoCambio,
} from "./actions";

export default async function FamiliarPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const fam = await getFamilyBudgetContext();

  if (!fam) {
    return (
      <div>
        <PageHeader
          title="Presupuesto Familiar"
          description="Un presupuesto de gastos del hogar compartido con otras cuentas."
        />
        <Card>
          <CardBody className="text-sm text-gray-600">
            Tu cuenta todavía no está vinculada a un Presupuesto Familiar. Podés
            activarlo o unirte con un código desde{" "}
            <Link href="/config" className="text-navy-light hover:underline">
              Configuración
            </Link>
            .
          </CardBody>
        </Card>
      </div>
    );
  }

  const { supabase, familyBudget, members, currency } = fam;
  const now = new Date();
  const sp = await searchParams;
  const mes = Number(sp.mes) || now.getMonth() + 1;
  const anio = Number(sp.anio) || now.getFullYear();

  const [{ data: cats }, { data: items }] = await Promise.all([
    supabase
      .from("family_budget_categories")
      .select("*")
      .eq("family_budget_id", familyBudget.id)
      .order("orden", { ascending: true }),
    supabase
      .from("family_budget_items")
      .select("*")
      .eq("family_budget_id", familyBudget.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .order("created_at", { ascending: true }),
  ]);

  const categorias = (cats ?? []) as FamilyBudgetCategory[];
  const itemsList = (items ?? []) as FamilyBudgetItem[];
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);
  const enPrimaria = (it: FamilyBudgetItem) =>
    aPrimaria(Number(it.monto), it.moneda, currency);

  const totalGastosMes = itemsList.reduce((a, it) => a + enPrimaria(it), 0);
  const sumaSalarios = members.reduce((a, m) => a + Number(m.salario_mensual), 0);

  const secundaria: Moneda | null =
    currency.activas.find((m) => m !== currency.primaria) ?? null;

  return (
    <div>
      <PageHeader
        title="Presupuesto Familiar"
        description="Gastos del hogar compartidos. Los totales se muestran en la moneda primaria del presupuesto."
        action={<MonthSwitcher mes={mes} anio={anio} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Total Gastos del Mes</p>
          <p className="text-xl font-semibold text-navy">{fmt(totalGastosMes)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Cuentas Vinculadas</p>
          <p className="text-xl font-semibold text-navy">{members.length}</p>
        </Card>
        <Card className="p-4 flex flex-col gap-2">
          <p className="text-xs text-gray-500 uppercase">Tipo de cambio del familiar</p>
          {secundaria ? (
            <ExchangeRateWidget
              primaria={currency.primaria}
              secundaria={secundaria}
              tipoCambio={currency.tipoCambio}
              updateAction={updateFamilyTipoCambio}
            />
          ) : (
            <p className="text-sm text-gray-400">Una sola moneda activa.</p>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {categorias.map((cat) => {
          const catItems = itemsList
            .filter((it) => it.categoria === cat.nombre)
            .map((it) => ({
              id: it.id,
              concepto: it.concepto,
              monto: Number(it.monto),
              moneda: it.moneda,
              automatico: Boolean(it.automatico),
            }));
          const total = catItems.reduce(
            (a, it) => a + aPrimaria(it.monto, it.moneda, currency),
            0,
          );
          return (
            <FamilyCategoryCard
              key={cat.id}
              categoriaId={cat.id}
              categoria={cat.nombre}
              items={catItems}
              total={total}
              mes={mes}
              anio={anio}
              currency={currency}
              addAction={addFamilyItem}
              updateAction={updateFamilyItem}
              deleteAction={deleteFamilyItem}
              deleteCategoryAction={deleteFamilyCategory}
            />
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agregar categoría</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addFamilyCategory} className="flex items-end gap-2 max-w-sm">
            <Field label="Nombre de la categoría">
              <Input name="nombre" placeholder="Ej. Mascotas" required />
            </Field>
            <Button type="submit" variant="secondary">
              Agregar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reparto según salario</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-gray-500 mb-4">
            Informativo: cuánto le corresponde a cada cuenta de los{" "}
            {fmt(totalGastosMes)} en gastos de este mes, en proporción a su
            salario. No se suma al total.
          </p>
          <ul className="divide-y divide-border text-sm">
            {members.map((m) => {
              const share = sumaSalarios
                ? (Number(m.salario_mensual) / sumaSalarios) * totalGastosMes
                : 0;
              const pct = sumaSalarios ? Number(m.salario_mensual) / sumaSalarios : 0;
              return (
                <li key={m.user_id} className="flex justify-between py-2">
                  <span className="text-gray-700">
                    Aporte de {m.display_name || "—"} según salario
                    <span className="text-gray-400"> · {formatoPct(pct)}</span>
                  </span>
                  <span className="font-medium text-navy">{fmt(share)}</span>
                </li>
              );
            })}
            {members.length === 0 && (
              <li className="py-2 text-gray-400">Sin miembros.</li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
