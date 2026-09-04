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
  ingresos: number;
  gastado: number;
  disponible: number;
  pct: number;
  semaforo: Semaforo;
  /** Meta ilimitada: no hay tope, `disponible` pasa a ser lo gastado. */
  ilimitado: boolean;
  movimientosPeriodo: EnvelopeMovement[];
  historial: EnvelopeMovement[];
};

/**
 * Total / Ingresos / Gastado / Disponible del período vigente. Sobre los
 * movimientos con `fecha >= ciclo_inicio`; los anteriores quedan en `historial`.
 *   disponible = (límite + ingresos) − gastado
 * Si el sobre tiene meta ilimitada no hay tope que comparar: `disponible` pasa
 * a ser lo gastado (para mostrarlo) y el semáforo queda siempre en verde.
 */
export function resumenSobre(env: Envelope, movs: EnvelopeMovement[]): ResumenSobre {
  const inicio = env.ciclo_inicio;
  const movimientosPeriodo = movs.filter((mv) => mv.fecha >= inicio);
  const historial = movs.filter((mv) => mv.fecha < inicio);

  const suma = (tipo: "income" | "expense") =>
    movimientosPeriodo
      .filter((mv) => mv.tipo === tipo)
      .reduce((a, mv) => a + (Number(mv.monto) || 0), 0);

  const ilimitado = Boolean(env.limite_ilimitado);
  const total = Number(env.limite_mensual) || 0;
  const ingresos = suma("income");
  const gastado = suma("expense");
  const base = total + ingresos;

  return {
    total,
    ingresos,
    gastado,
    disponible: ilimitado ? gastado : base - gastado,
    pct: ilimitado ? 0 : base > 0 ? gastado / base : 0,
    semaforo: ilimitado ? "verde" : semaforoSobre(gastado, base),
    ilimitado,
    movimientosPeriodo,
    historial,
  };
}
