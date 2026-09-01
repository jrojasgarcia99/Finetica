import { getPersonalContext, getFamilyBudgetContext, ensurePaymentMethods } from "@/lib/data";
import { tFor, familyCategoryLabel } from "@/lib/i18n";
import { resumenSobre } from "@/lib/envelopes";
import { CATEGORIA_KEYS } from "@/lib/types";
import type { Categoria, Envelope, EnvelopeMovement } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EnvelopeCard } from "@/components/sobres/EnvelopeCard";
import { EnvelopeForm } from "@/components/sobres/EnvelopeForm";
import { createEnvelope } from "./actions";

export default async function SobresPage() {
  const { supabase, currency, locale } = await getPersonalContext();
  const t = tFor(locale);
  await ensurePaymentMethods();
  const fam = await getFamilyBudgetContext();

  // RLS ya limita a: sobres del espacio personal + sobres del Presupuesto Familiar.
  const { data: envRaw } = await supabase
    .from("envelopes")
    .select("*")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  const envelopes = (envRaw ?? []) as Envelope[];

  const ids = envelopes.map((e) => e.id);
  const { data: movRaw } = ids.length
    ? await supabase.from("envelope_movements").select("*").in("envelope_id", ids)
    : { data: [] };
  const movs = (movRaw ?? []) as EnvelopeMovement[];
  const byEnv = new Map<string, EnvelopeMovement[]>();
  for (const m of movs) {
    const arr = byEnv.get(m.envelope_id);
    if (arr) arr.push(m);
    else byEnv.set(m.envelope_id, [m]);
  }

  const personalCats = CATEGORIA_KEYS.map((c) => ({
    value: c as string,
    label: t(`categoria.${c}` as `categoria.${Categoria}`),
  }));

  let familyCats: { value: string; label: string }[] = [];
  if (fam) {
    const { data: cats } = await fam.supabase
      .from("family_budget_categories")
      .select("nombre")
      .eq("family_budget_id", fam.familyBudget.id)
      .order("orden", { ascending: true });
    familyCats = (cats ?? []).map((c) => ({
      value: c.nombre as string,
      label: familyCategoryLabel(c.nombre as string, locale),
    }));
  }

  const catLabel = (env: Envelope) =>
    env.scope_type === "personal"
      ? t(`categoria.${env.categoria}` as `categoria.${Categoria}`)
      : familyCategoryLabel(env.categoria, locale);

  return (
    <div>
      <PageHeader title={t("sobres.title")} description={t("sobres.desc")} />

      {envelopes.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {envelopes.map((env) => {
            const r = resumenSobre(env, byEnv.get(env.id) ?? []);
            return (
              <EnvelopeCard
                key={env.id}
                envelope={env}
                categoriaLabel={catLabel(env)}
                total={r.total}
                gastado={r.gastado}
                disponible={r.disponible}
                pct={r.pct}
                semaforo={r.semaforo}
              />
            );
          })}
        </div>
      ) : (
        <Card className="mb-6">
          <CardBody className="text-sm text-gray-500">{t("sobres.empty")}</CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("sobres.newEnvelope")}</CardTitle>
        </CardHeader>
        <CardBody>
          <EnvelopeForm
            action={createEnvelope}
            hasFamily={fam !== null}
            personalCats={personalCats}
            familyCats={familyCats}
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
