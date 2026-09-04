"use client";

import Link from "next/link";
import { formatoMoneda } from "@/lib/calculations";
import type { Envelope, Semaforo } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";
import { EnvelopeRing } from "./EnvelopeRing";

/**
 * Tarjeta compacta de la lista de Sobres (grid de 2 columnas en móvil): anillo
 * de progreso con el ícono al centro, nombre y disponible. Presupuestado /
 * gastado quedan para la vista de detalle.
 */
export function EnvelopeCard({
  envelope,
  disponible,
  pct,
  semaforo,
  index = 0,
}: {
  envelope: Envelope;
  disponible: number;
  pct: number;
  semaforo: Semaforo;
  index?: number;
}) {
  const t = useT();
  const overdrawn = disponible < 0;
  const fmt = (v: number) => formatoMoneda(v, envelope.moneda);

  return (
    <Link
      href={`/sobres/${envelope.id}`}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      className="animate-sobre-card motion-reduce:animate-none flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-border bg-card p-3 text-center shadow-[var(--shadow-card)] transition-transform duration-150 hover:border-navy-light active:scale-[0.97]"
    >
      <EnvelopeRing
        icono={envelope.icono}
        pct={pct}
        semaforo={semaforo}
        overdrawn={overdrawn}
      />
      <p className="w-full truncate text-sm font-medium text-navy">
        {envelope.nombre}
      </p>
      <p className={`text-base font-semibold ${overdrawn ? "text-red" : "text-green"}`}>
        {fmt(disponible)}
      </p>
      <span className="sr-only">{t("sobres.available")}</span>
    </Link>
  );
}
