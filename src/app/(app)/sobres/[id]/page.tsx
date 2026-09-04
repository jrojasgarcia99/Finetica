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
import { AddMovementButton } from "@/components/sobres/AddMovementButton";
import { MovementRow } from "@/components/sobres/MovementRow";
import {
  addEnvelopeMovement,
  updateEnvelopeMovement,
  deleteEnvelopeMovement,
  resetEnvelopeNow,
  updateEnvelope,
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
        className="mb-4 inline-flex items-center gap-1.5 text-base font-medium text-navy-light hover:underline"
      >
        <ArrowLeft size={20} />
        {t("sobres.back")}
      </Link>

      <Card className="mb-6">
        <CardBody className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-white">
              <EnvelopeIcon name={env.icono} size={24} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-navy">{env.nombre}</h1>
              <p className="truncate text-xs text-gray-400">
                {catLabel}
                {env.scope_type === "family" ? ` · ${t("sobres.scopeFamily")}` : ""}
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <EnvelopeMenu
                envelope={env}
                resetAction={resetEnvelopeNow}
                updateAction={updateEnvelope}
                deleteAction={deleteEnvelope}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="space-y-3">
              {!r.ilimitado && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("sobres.total")}
                  </p>
                  <p className="text-base font-medium text-navy">{fmt(r.total)}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("sobres.spent")}
                </p>
                <p className="text-base font-medium text-navy">{fmt(r.gastado)}</p>
              </div>
              {r.ingresos > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("sobres.incomeTotal")}
                  </p>
                  <p className="text-base font-medium text-green">+{fmt(r.ingresos)}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {t("sobres.available")}
              </p>
              <p
                className={`text-[2.25rem] font-bold leading-tight ${
                  r.ilimitado ? "text-navy" : r.disponible < 0 ? "text-red" : "text-green"
                }`}
              >
                {fmt(r.disponible)}
              </p>
            </div>
          </div>

          {!r.ilimitado && <ProgressBar value={r.pct} color={color} />}
          <p className="text-xs text-gray-400">
            {env.sin_reinicio ? t("sobres.noAutoReset") : t("sobres.resetsOn", { date: proxLabel })}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sobres.currentPeriod")}</CardTitle>
          <AddMovementButton
            envelopeId={env.id}
            moneda={env.moneda}
            paymentMethods={paymentMethods}
            today={todayISO}
            action={addEnvelopeMovement}
          />
        </CardHeader>
        <CardBody>
          {r.movimientosPeriodo.length > 0 ? (
            <div className="space-y-2">
              {r.movimientosPeriodo.map((mv) => (
                <MovementRow
                  key={mv.id}
                  mv={mv}
                  moneda={env.moneda}
                  paymentMethods={paymentMethods}
                  today={todayISO}
                  updateAction={updateEnvelopeMovement}
                  deleteAction={deleteEnvelopeMovement}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t("sobres.noMovements")}</p>
          )}

          {r.historial.length > 0 && (
            <details className="mt-4 border-t border-border pt-3">
              <summary className="cursor-pointer text-sm font-medium text-navy-light hover:underline">
                {t("sobres.history")} ({r.historial.length})
              </summary>
              <div className="mt-2 space-y-2">
                {r.historial.map((mv) => (
                  <MovementRow
                    key={mv.id}
                    mv={mv}
                    moneda={env.moneda}
                    paymentMethods={paymentMethods}
                    today={todayISO}
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
