import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPersonalContext, getFamilyBudgetContext, ensurePersonalCategories } from "@/lib/data";
import { tFor, familyCategoryLabel } from "@/lib/i18n";
import { nowCR } from "@/lib/envelopes";
import type { Envelope, Moneda, PersonalBudgetCategory } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EnvelopeForm, type LineOption } from "@/components/sobres/EnvelopeForm";
import { createEnvelope } from "../actions";

type LineRow = {
  id: string;
  categoria: string;
  concepto: string;
  monto: number | string;
  moneda: Moneda;
};

export default async function NuevoSobrePage() {
  const { supabase, space, currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  await ensurePersonalCategories();
  const fam = await getFamilyBudgetContext();

  const d = nowCR();
  const mes = d.getMonth() + 1;
  const anio = d.getFullYear();

  const [{ data: pItemsRaw }, { data: envsRaw }, { data: catsRaw }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("id, categoria, concepto, monto, moneda")
      .eq("space_id", space.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .order("orden", { ascending: true }),
    supabase
      .from("envelopes")
      .select(
        "scope_type, categoria, nombre, source_budget_item_id, source_family_budget_item_id",
      ),
    supabase
      .from("personal_budget_categories")
      .select("clave, nombre")
      .eq("space_id", space.id),
  ]);

  const catByClave = new Map(
    ((catsRaw ?? []) as Pick<PersonalBudgetCategory, "clave" | "nombre">[]).map((c) => [
      c.clave,
      c.nombre,
    ]),
  );

  let fItemsRaw: LineRow[] = [];
  if (fam) {
    const { data } = await fam.supabase
      .from("family_budget_items")
      .select("id, categoria, concepto, monto, moneda")
      .eq("family_budget_id", fam.familyBudget.id)
      .eq("mes", mes)
      .eq("anio", anio)
      .order("orden", { ascending: true });
    fItemsRaw = (data ?? []) as LineRow[];
  }

  const envs = (envsRaw ?? []) as Pick<
    Envelope,
    "scope_type" | "categoria" | "nombre" | "source_budget_item_id" | "source_family_budget_item_id"
  >[];
  const usedPIds = new Set(envs.map((e) => e.source_budget_item_id).filter(Boolean));
  const usedFIds = new Set(envs.map((e) => e.source_family_budget_item_id).filter(Boolean));
  const usedPNames = new Set(
    envs.filter((e) => e.scope_type === "personal").map((e) => `${e.categoria}|${e.nombre}`),
  );
  const usedFNames = new Set(
    envs.filter((e) => e.scope_type === "family").map((e) => `${e.categoria}|${e.nombre}`),
  );

  const money = (v: number, m: Moneda) =>
    `${m === "USD" ? "$" : "₡"}${Number(v).toLocaleString(locale === "en" ? "en-US" : "es-CR")}`;

  const personalLines: LineOption[] = ((pItemsRaw ?? []) as LineRow[])
    .filter(
      (i) =>
        catByClave.has(i.categoria) &&
        !usedPIds.has(i.id) &&
        !usedPNames.has(`${i.categoria}|${i.concepto}`),
    )
    .map((i) => ({
      id: i.id,
      concepto: i.concepto,
      monto: Number(i.monto),
      moneda: i.moneda,
      label: `${catByClave.get(i.categoria) ?? i.categoria} · ${i.concepto} — ${money(
        Number(i.monto),
        i.moneda,
      )}`,
    }));

  const familyLines: LineOption[] = fItemsRaw
    .filter((i) => !usedFIds.has(i.id) && !usedFNames.has(`${i.categoria}|${i.concepto}`))
    .map((i) => ({
      id: i.id,
      concepto: i.concepto,
      monto: Number(i.monto),
      moneda: i.moneda,
      label: `${familyCategoryLabel(i.categoria, locale)} · ${i.concepto} — ${money(
        Number(i.monto),
        i.moneda,
      )}`,
    }));

  return (
    <div>
      <Link
        href="/sobres"
        className="mb-4 inline-flex items-center gap-1 text-sm text-navy-light hover:underline"
      >
        <ArrowLeft size={15} />
        {t("sobres.back")}
      </Link>

      <PageHeader title={t("sobres.newEnvelope")} description={t("sobres.newEnvelopeDesc")} />

      <Card>
        <CardBody>
          <EnvelopeForm
            action={createEnvelope}
            hasFamily={fam !== null}
            personalLines={personalLines}
            familyLines={familyLines}
            personalActivas={currency.activas}
            personalPrimaria={currency.primaria}
            familyActivas={fam?.currency.activas ?? currency.activas}
            familyPrimaria={fam?.currency.primaria ?? currency.primaria}
          />
        </CardBody>
      </Card>
    </div>
  );
}
