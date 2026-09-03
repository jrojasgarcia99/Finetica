import Link from "next/link";
import { Plus } from "lucide-react";
import { getPersonalContext, ensurePaymentMethods } from "@/lib/data";
import { tFor, familyCategoryLabel } from "@/lib/i18n";
import { resumenSobre } from "@/lib/envelopes";
import type { Categoria, Envelope, EnvelopeMovement } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnvelopeCard } from "@/components/sobres/EnvelopeCard";

export default async function SobresPage() {
  const { supabase, locale } = await getPersonalContext();
  const t = tFor(locale);
  await ensurePaymentMethods();

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

  const catLabel = (env: Envelope) =>
    env.scope_type === "personal"
      ? t(`categoria.${env.categoria}` as `categoria.${Categoria}`)
      : familyCategoryLabel(env.categoria, locale);

  return (
    <div>
      <PageHeader title={t("sobres.title")} description={t("sobres.desc")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {envelopes.map((env) => {
          const r = resumenSobre(env, byEnv.get(env.id) ?? []);
          return (
            <EnvelopeCard
              key={env.id}
              envelope={env}
              categoriaLabel={catLabel(env)}
              total={r.total}
              ingresos={r.ingresos}
              gastado={r.gastado}
              disponible={r.disponible}
              pct={r.pct}
              semaforo={r.semaforo}
            />
          );
        })}

        <Link
          href="/sobres/nuevo"
          className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border bg-card p-4 text-gray-400 transition-colors hover:border-navy-light hover:text-navy"
        >
          <Plus size={24} />
          <span className="text-sm font-medium">{t("sobres.newEnvelope")}</span>
        </Link>
      </div>

      {envelopes.length === 0 && <p className="mt-4 text-sm text-gray-400">{t("sobres.empty")}</p>}
    </div>
  );
}
