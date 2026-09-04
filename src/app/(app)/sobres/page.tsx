import Link from "next/link";
import { Plus } from "lucide-react";
import { getPersonalContext, ensurePaymentMethods } from "@/lib/data";
import { tFor } from "@/lib/i18n";
import { resumenSobre } from "@/lib/envelopes";
import type { Envelope, EnvelopeMovement } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnvelopeCard } from "@/components/sobres/EnvelopeCard";

export default async function SobresPage() {
  const { supabase, user, locale } = await getPersonalContext();
  const t = tFor(locale);

  // Independientes entre sí: en paralelo en vez de uno tras otro.
  const [, { data: envRaw }] = await Promise.all([
    ensurePaymentMethods({ supabase, user }),
    // RLS ya limita a: sobres del espacio personal + sobres del Presupuesto Familiar.
    supabase
      .from("envelopes")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
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

  return (
    <div>
      <PageHeader title={t("sobres.title")} description={t("sobres.desc")} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {envelopes.map((env, i) => {
          const r = resumenSobre(env, byEnv.get(env.id) ?? []);
          return (
            <EnvelopeCard
              key={env.id}
              envelope={env}
              disponible={r.disponible}
              pct={r.pct}
              semaforo={r.semaforo}
              ilimitado={r.ilimitado}
              index={i}
            />
          );
        })}

        <Link
          href="/sobres/nuevo"
          className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border bg-card p-4 text-gray-400 transition-colors duration-150 hover:border-navy-light hover:text-navy active:scale-[0.97]"
        >
          <Plus size={24} />
          <span className="text-sm font-medium">{t("sobres.newEnvelope")}</span>
        </Link>
      </div>

      {envelopes.length === 0 && <p className="mt-4 text-sm text-gray-400">{t("sobres.empty")}</p>}
    </div>
  );
}
