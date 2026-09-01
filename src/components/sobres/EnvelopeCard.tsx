"use client";

import Link from "next/link";
import { formatoMoneda } from "@/lib/calculations";
import { SEMAFORO_COLOR, type Envelope, type Semaforo } from "@/lib/types";
import { ProgressBar } from "@/components/ui/Semaforo";
import { useT } from "@/components/i18n/I18nProvider";
import { EnvelopeIcon } from "./envelope-icons";

export function EnvelopeCard({
  envelope,
  categoriaLabel,
  total,
  gastado,
  disponible,
  pct,
  semaforo,
}: {
  envelope: Envelope;
  categoriaLabel: string;
  total: number;
  gastado: number;
  disponible: number;
  pct: number;
  semaforo: Semaforo;
}) {
  const t = useT();
  const fmt = (v: number) => formatoMoneda(v, envelope.moneda);
  const color = SEMAFORO_COLOR[semaforo];

  return (
    <Link
      href={`/sobres/${envelope.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-navy-light"
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${color}1A`, color }}
        >
          <EnvelopeIcon name={envelope.icono} size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-navy">{envelope.nombre}</p>
          <p className="truncate text-xs text-gray-400">
            {categoriaLabel}
            {envelope.scope_type === "family" ? ` · ${t("sobres.scopeFamily")}` : ""}
          </p>
        </div>
      </div>

      <p
        className="text-2xl font-semibold text-navy"
        style={disponible < 0 ? { color: SEMAFORO_COLOR.rojo } : undefined}
      >
        {fmt(disponible)}
      </p>
      <p className="mb-2 text-xs text-gray-500">{t("sobres.available")}</p>

      <ProgressBar value={pct} color={color} />

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>
          {t("sobres.spent")}: {fmt(gastado)}
        </span>
        <span>
          {t("sobres.total")}: {fmt(total)}
        </span>
      </div>
    </Link>
  );
}
