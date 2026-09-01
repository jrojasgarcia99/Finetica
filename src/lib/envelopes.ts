// ============================================================================
// Sobres (envelope budgeting) — cálculo de período vigente y semáforo.
// El inicio del período y el reinicio real viven en SQL (envelope_period_start
// / reset_due_envelopes); esto lo replica para mostrarlo en la interfaz.
// ============================================================================
import { semaforoMaximo } from "./calculations";
import type { Envelope, EnvelopeMovement, Semaforo } from "./types";

/**
 * Fecha de arranque del período que contiene a `hoy`, según el día de reinicio
 * del sobre (`null` = primer día del mes calendario).
 */
export function envelopePeriodStart(dia: number | null, hoy: Date): Date {
  const y = hoy.getFullYear();
  const m = hoy.getMonth(); // 0-based
  if (dia == null) return new Date(y, m, 1);

  const dimThis = new Date(y, m + 1, 0).getDate();
  const anchorThis = new Date(y, m, Math.min(dia, dimThis));
  const hoyMid = new Date(y, m, hoy.getDate());
  if (hoyMid.getTime() >= anchorThis.getTime()) return anchorThis;

  const dimPrev = new Date(y, m, 0).getDate();
  return new Date(y, m - 1, Math.min(dia, dimPrev));
}

/** `YYYY-MM-DD` local, para comparar contra `envelope.ciclo_inicio`. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * "Ahora" en hora de Costa Rica (UTC-6 todo el año). En el servidor (UTC) los
 * getters locales de la fecha devuelta dan la hora de pared de CR, igual que
 * hace `reset_due_envelopes()` en SQL.
 */
export function nowCR(): Date {
  return new Date(Date.now() - 6 * 60 * 60 * 1000);
}

/** "Gastado vs. límite" es un semáforo de tipo máximo con meta = 100%. */
export function semaforoSobre(gastado: number, limite: number): Semaforo {
  if (limite <= 0) return gastado > 0 ? "rojo" : "verde";
  return semaforoMaximo(gastado / limite, 1);
}

export type ResumenSobre = {
  total: number;
  gastado: number;
  disponible: number;
  pct: number;
  semaforo: Semaforo;
  movimientosPeriodo: EnvelopeMovement[];
  historial: EnvelopeMovement[];
};

/**
 * Total / Gastado / Disponible del período vigente. `gastado` = suma de los
 * expenses con `fecha >= ciclo_inicio`; los anteriores quedan en `historial`.
 */
export function resumenSobre(env: Envelope, movs: EnvelopeMovement[]): ResumenSobre {
  const inicio = env.ciclo_inicio;
  const movimientosPeriodo = movs.filter((mv) => mv.fecha >= inicio);
  const historial = movs.filter((mv) => mv.fecha < inicio);
  const gastado = movimientosPeriodo
    .filter((mv) => mv.tipo === "expense")
    .reduce((a, mv) => a + (Number(mv.monto) || 0), 0);
  const total = Number(env.limite_mensual) || 0;
  const disponible = total - gastado;
  return {
    total,
    gastado,
    disponible,
    pct: total > 0 ? gastado / total : 0,
    semaforo: semaforoSobre(gastado, total),
    movimientosPeriodo,
    historial,
  };
}
