import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPersonalContext } from "@/lib/data";
import { tFor, familyCategoryLabel, mesesLabel } from "@/lib/i18n";
import { formatoMoneda } from "@/lib/calculations";
import { resumenSobre, envelopePeriodStart, toISODate, nowCR } from "@/lib/envelopes";
import { SEMAFORO_COLOR } from "@/lib/types";
import type { Categoria, Envelope, EnvelopeMovement } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Semaforo";
import { EnvelopeIcon } from "@/components/sobres/envelope-icons";
import { EnvelopeMenu } from "@/components/sobres/EnvelopeMenu";
import { MovementForm } from "@/components/sobres/MovementForm";
import { MovementRow } from "@/components/sobres/MovementRow";
import {
  addEnvelopeMovement,
  updateEnvelopeMovement,
  deleteEnvelopeMovement,
  resetEnvelopeNow,
  deleteEnvelope,
} from "../actions";

export default async function SobreDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, locale } = await getPersonalContext();
  const t = tFor(locale);

  const { data: envRaw } = await supabase
    .from("envelopes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const env = envRaw as Envelope | null;
  if (!env) notFound();

  const [{ data: movRaw }, { data: pmRaw }] = await Promise.all([
    supabase
      .from("envelope_movements")
      .select("*")
      .eq("envelope_id", id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("payment_methods").select("nombre").order("orden", { ascending: true }),
  ]);

  const movs = (movRaw ?? []) as EnvelopeMovement[];
  const paymentMethods = (pmRaw ?? []).map((p) => p.nombre as string);

  const r = resumenSobre(env, movs);
  const fmt = (v: number) => formatoMoneda(v, env.moneda);
  const color = SEMAFORO_COLOR[r.semaforo];
  const catLabel =
    env.scope_type === "personal"
      ? t(`categoria.${env.categoria}` as `categoria.${Categoria}`)
      : familyCategoryLabel(env.categoria, locale);

  // Próximo reinicio (para mostrar la fecha).
  const inicio = envelopePeriodStart(env.reinicio_dia, nowCR());
  const y = inicio.getFullYear();
  const m = inicio.getMonth();
  let prox: Date;
  if (env.reinicio_dia == null) {
    prox = new Date(y, m + 1, 1);
  } else {
    const dim = new Date(y, m + 2, 0).getDate();
    prox = new Date(y, m + 1, Math.min(env.reinicio_dia, dim));
  }
  const MESES = mesesLabel(locale);
  const proxLabel = `${prox.getDate()} ${MESES[prox.getMonth()]}`;

  const todayISO = toISODate(nowCR());

  return (
    <div>
      <Link
        href="/sobres"
        className="mb-4 inline-flex items-center gap-1 text-sm text-navy-light hover:underline"
      >
        <ArrowLeft size={15} />
        {t("sobres.back")}
      </Link>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${color}1A`, color }}
          >
            <EnvelopeIcon name={env.icono} size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-navy">{env.nombre}</h1>
            <p className="text-xs text-gray-400">
              {catLabel}
              {env.scope_type === "family" ? ` · ${t("sobres.scopeFamily")}` : ""}
            </p>
          </div>
        </div>
        <EnvelopeMenu
          envelopeId={env.id}
          resetAction={resetEnvelopeNow}
          deleteAction={deleteEnvelope}
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <p className="text-xs uppercase text-gray-500">{t("sobres.available")}</p>
          <p
            className="mb-3 text-4xl font-bold text-navy"
            style={r.disponible < 0 ? { color: SEMAFORO_COLOR.rojo } : undefined}
          >
            {fmt(r.disponible)}
          </p>
          <ProgressBar value={r.pct} color={color} />
          <div className="mt-3 flex justify-between text-sm text-gray-500">
            <span>
              {t("sobres.total")}: <span className="text-navy">{fmt(r.total)}</span>
            </span>
            <span>
              {t("sobres.spent")}: <span className="text-navy">{fmt(r.gastado)}</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400">{t("sobres.resetsOn", { date: proxLabel })}</p>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("sobres.addMovement")}</CardTitle>
        </CardHeader>
        <CardBody>
          <MovementForm
            envelopeId={env.id}
            moneda={env.moneda}
            paymentMethods={paymentMethods}
            today={todayISO}
            action={addEnvelopeMovement}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sobres.currentPeriod")}</CardTitle>
        </CardHeader>
        <CardBody>
          {r.movimientosPeriodo.length > 0 ? (
            r.movimientosPeriodo.map((mv) => (
              <MovementRow
                key={mv.id}
                mv={mv}
                moneda={env.moneda}
                paymentMethods={paymentMethods}
                updateAction={updateEnvelopeMovement}
                deleteAction={deleteEnvelopeMovement}
              />
            ))
          ) : (
            <p className="text-sm text-gray-400">{t("sobres.noMovements")}</p>
          )}

          {r.historial.length > 0 && (
            <details className="mt-4 border-t border-border pt-3">
              <summary className="cursor-pointer text-sm font-medium text-navy-light hover:underline">
                {t("sobres.history")} ({r.historial.length})
              </summary>
              <div className="mt-2">
                {r.historial.map((mv) => (
                  <MovementRow
                    key={mv.id}
                    mv={mv}
                    moneda={env.moneda}
                    paymentMethods={paymentMethods}
                    updateAction={updateEnvelopeMovement}
                    deleteAction={deleteEnvelopeMovement}
                  />
                ))}
              </div>
            </details>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
