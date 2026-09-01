"use client";

import { Semaforo, SEMAFORO_COLOR } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";

export function SemaforoBadge({ nivel }: { nivel: Semaforo }) {
  const t = useT();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: `${SEMAFORO_COLOR[nivel]}1A`,
        color: SEMAFORO_COLOR[nivel],
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SEMAFORO_COLOR[nivel] }}
      />
      {t(`semaforo.${nivel}`)}
    </span>
  );
}

export function ProgressBar({
  value,
  color,
}: {
  value: number; // 0..1
  color?: string;
}) {
  const pctClamped = Math.max(0, Math.min(1, value));
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pctClamped * 100}%`,
          backgroundColor: color ?? "var(--navy)",
        }}
      />
    </div>
  );
}
