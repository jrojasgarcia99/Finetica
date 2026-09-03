import Link from "next/link";
import {
  getPersonalContext,
  getFamilyBudgetContext,
  getFamilyRepartoContext,
  rolloverForMe,
} from "@/lib/data";
import { formatoMoneda, formatoPct } from "@/lib/calculations";
import { aPrimaria } from "@/lib/currency";
import { tFor, familyCategoryLabel } from "@/lib/i18n";
import type { FamilyBudgetCategory, FamilyBudgetItem, Moneda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoHint } from "@/components/ui/Tooltip";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ExchangeRateWidget } from "@/components/layout/ExchangeRateWidget";
import { FamilyBoard, type FamilySection } from "@/components/familiar/FamilyBoard";
import { CategoryReorder } from "@/components/presupuesto/CategoryReorder";
import {
  addFamilyItem,
  updateFamilyItem,
  deleteFamilyItem,
  addFamilyCategory,
  deleteFamilyCategory,
  updateFamilyTipoCambio,
  applyFamilyOrder,
  reorderFamilyCategories,
} from "./actions";

export default async function FamiliarPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const { locale } = await getPersonalContext();
  const t = tFor(locale);
  const fam = await getFamilyBudgetContext();

  if (!fam) {
    return (
      <div>
        <PageHeader title={t("familiar.title")} description={t("familiar.descShort")} />
        <Card>
          <CardBody className="text-sm text-gray-600">
            {t("familiar.notLinked")}{" "}
            <Link href="/config" className="text-navy-light hover:underline">
              {t("familiar.configLink")}
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

  await rolloverForMe(anio, mes);

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
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const categorias = (cats ?? []) as FamilyBudgetCategory[];
  const itemsList = (items ?? []) as FamilyBudgetItem[];
  const fmt = (v: number) => formatoMoneda(v, currency.primaria);
  const enPrimaria = (it: { monto: number; moneda: Moneda }) =>
    aPrimaria(Number(it.monto), it.moneda, currency);

  const totalGastosMes = itemsList.reduce((a, it) => a + enPrimaria(it), 0);
  const reparto = await getFamilyRepartoContext(currency);
  const detalle = reparto ? reparto.detalle(mes, anio) : [];
  const secundaria: Moneda | null =
    currency.activas.find((m) => m !== currency.primaria) ?? null;

  const sections: FamilySection[] = categorias.map((cat) => {
    const catItems = itemsList.filter((it) => it.categoria === cat.nombre);
    return {
      key: cat.nombre,
      label: familyCategoryLabel(cat.nombre, locale),
      categoriaId: cat.id,
      total: catItems.reduce((a, it) => a + enPrimaria(it), 0),
      items: catItems.map((it) => ({
        id: it.id,
        concepto: it.concepto,
        monto: Number(it.monto),
        moneda: it.moneda,
        automatico: Boolean(it.automatico),
        recurrente: Boolean(it.recurrente),
      })),
    };
  });

  return (
    <div>
      <PageHeader
        title={t("familiar.title")}
        description={t("familiar.descLong")}
        action={<MonthSwitcher mes={mes} anio={anio} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">{t("familiar.totalMonthExpenses")}</p>
          <p className="text-xl font-semibold text-navy">{fmt(totalGastosMes)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">{t("familiar.linkedAccounts")}</p>
          <p className="text-xl font-semibold text-navy">{members.length}</p>
        </Card>
        <Card className="p-4 flex flex-col gap-2">
          <p className="flex items-center gap-1 text-xs text-gray-500 uppercase">
            {t("familiar.familyExchangeRate")}
            <InfoHint content={t("tip.fxFamiliar")} />
          </p>
          {secundaria ? (
            <ExchangeRateWidget
              primaria={currency.primaria}
              secundaria={secundaria}
              tipoCambio={currency.tipoCambio}
              updateAction={updateFamilyTipoCambio}
            />
          ) : (
            <p className="text-sm text-gray-400">{t("common.oneCurrencyActive")}</p>
          )}
        </Card>
      </div>

      <CategoryReorder
        items={categorias.map((c) => ({ id: c.id, label: familyCategoryLabel(c.nombre, locale) }))}
        action={reorderFamilyCategories}
      />

      <FamilyBoard
        sections={sections}
        currency={currency}
        mes={mes}
        anio={anio}
        addAction={addFamilyItem}
        updateAction={updateFamilyItem}
        deleteAction={deleteFamilyItem}
        deleteCategoryAction={deleteFamilyCategory}
        applyOrder={applyFamilyOrder}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("familiar.addCategory")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={addFamilyCategory} className="flex items-end gap-2 max-w-sm">
            <Field label={t("familiar.categoryName")}>
              <Input name="nombre" placeholder={t("familiar.categoryNamePh")} required />
            </Field>
            <Button type="submit" variant="secondary">
              {t("common.add")}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            {t("familiar.splitTitle")}
            <InfoHint content={t("tip.reparto")} />
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-gray-500 mb-4">
            {t("familiar.splitDesc", { total: fmt(totalGastosMes) })}
          </p>
          <ul className="divide-y divide-border text-sm">
            {detalle.map((d) => (
              <li key={d.userId} className="flex justify-between py-2">
                <span className="text-gray-700">
                  {t("familiar.contributionOf", { name: d.nombre || "—" })}
                  <span className="text-gray-400">
                    {" · "}
                    {formatoPct(d.fraccion)}
                    {" · "}
                    {d.fuente === "fijo" ? t("familiar.sourceFixed") : t("familiar.sourceDisposable")}
                  </span>
                </span>
                <span className="font-medium text-navy">{fmt(d.monto)}</span>
              </li>
            ))}
            {detalle.length === 0 && (
              <li className="py-2 text-gray-400">{t("familiar.noMembers")}</li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
