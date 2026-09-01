// ============================================================================
// Finéfica · Presupuesto — motor de cálculo
// Cada fórmula aquí es la traducción directa de las fórmulas del libro de
// Excel original. Se documenta la celda/hoja de origen para poder auditar.
// ============================================================================
import type { BudgetItem, Categoria, Deuda, PersonalSpace, Moneda, Semaforo } from "./types";

export function sumCategoria(
  items: BudgetItem[],
  categoria: Categoria,
  mes: number,
  anio: number,
): number {
  return items
    .filter((i) => i.categoria === categoria && i.mes === mes && i.anio === anio)
    .reduce((acc, i) => acc + Number(i.monto || 0), 0);
}

export type Totales = {
  ingresos: number;
  rebajos: number;
  ingresoDisponible: number; // Presupuesto!E28
  gastos: number;
  ahorros: number;
  inversion: number;
  jugar: number;
  donativos: number;
  formacion: number;
  deuda: number; // suma de cuotas mínimas de deudas activas (TotalCuotaMensualDeudas)
  balance: number; // Presupuesto!E104
};

export function calcularTotales(
  items: BudgetItem[],
  deudas: Deuda[],
  mes: number,
  anio: number,
  /** Gasto adicional que se suma a "gastos" (p. ej. el aporte al Presupuesto Familiar). */
  gastosExtra = 0,
): Totales {
  const ingresos = sumCategoria(items, "ingresos", mes, anio);
  const rebajos = sumCategoria(items, "rebajos", mes, anio);
  const ingresoDisponible = ingresos - rebajos;
  const gastos = sumCategoria(items, "gastos", mes, anio) + Number(gastosExtra || 0);
  const ahorros = sumCategoria(items, "ahorros", mes, anio);
  const inversion = sumCategoria(items, "inversion", mes, anio);
  const jugar = sumCategoria(items, "jugar", mes, anio);
  const donativos = sumCategoria(items, "donativos", mes, anio);
  const formacion = sumCategoria(items, "formacion", mes, anio);
  const deuda = deudas
    .filter((d) => d.estado === "Activa")
    .reduce((acc, d) => acc + Number(d.cuota_minima || 0), 0);
  const balance =
    ingresoDisponible - gastos - ahorros - inversion - jugar - deuda - donativos - formacion;

  return {
    ingresos,
    rebajos,
    ingresoDisponible,
    gastos,
    ahorros,
    inversion,
    jugar,
    donativos,
    formacion,
    deuda,
    balance,
  };
}

export function pct(valor: number, base: number): number {
  if (!base) return 0;
  return valor / base;
}

// --- Semáforos, replicando los umbrales exactos de cada hoja del Excel -----

/** Gastos (Presupuesto!I43) y Deuda (Presupuesto!I77): tipo "máximo". */
export function semaforoMaximo(pctValor: number, meta: number): Semaforo {
  if (pctValor <= meta * 0.8) return "verde";
  if (pctValor <= meta) return "amarillo";
  if (pctValor <= meta * 1.2) return "naranja";
  return "rojo";
}

/** Jugar (Presupuesto!I74): tipo "máximo recomendado", escala más laxa. */
export function semaforoJugar(pctValor: number, meta: number): Semaforo {
  if (pctValor <= meta) return "verde";
  if (pctValor <= meta * 1.25) return "amarillo";
  if (pctValor <= meta * 1.5) return "naranja";
  return "rojo";
}

/** Ahorros (I53) e Inversión (I63): tipo "mínimo", 4 niveles. */
export function semaforoMinimo(pctValor: number, meta: number): Semaforo {
  if (pctValor >= meta) return "verde";
  if (pctValor >= meta * (2 / 3)) return "amarillo";
  if (pctValor >= meta * (1 / 3)) return "naranja";
  return "rojo";
}

/** Donativos (I85) y Formación (I93): tipo "mínimo", 3 niveles (sin naranja). */
export function semaforoMinimoSimple(pctValor: number, meta: number): Semaforo {
  if (pctValor >= meta) return "verde";
  if (pctValor >= meta * 0.5) return "amarillo";
  return "rojo";
}

/** Balance (Presupuesto!I104). */
export function semaforoBalance(balance: number, ingresoDisponible: number): Semaforo {
  const p = pct(balance, ingresoDisponible);
  if (balance < -0.01 * Math.max(ingresoDisponible, 1)) return "rojo";
  if (p >= -0.01 && p <= 0.01) return "verde";
  return "amarillo";
}

export type SemaforoCategoria = {
  key: string;
  label: string;
  valor: number;
  pct: number;
  meta: number;
  semaforo: Semaforo;
};

/** Replica el "Semáforo de Salud Financiera" del Dashboard de Presupuesto. */
export function calcularSemaforos(t: Totales, hh: PersonalSpace): SemaforoCategoria[] {
  const base = t.ingresoDisponible;
  return [
    {
      key: "gastos",
      label: "Gastos",
      valor: t.gastos,
      pct: pct(t.gastos, base),
      meta: hh.meta_gastos,
      semaforo: semaforoMaximo(pct(t.gastos, base), hh.meta_gastos),
    },
    {
      key: "ahorros",
      label: "Ahorros",
      valor: t.ahorros,
      pct: pct(t.ahorros, base),
      meta: hh.meta_ahorro,
      semaforo: semaforoMinimo(pct(t.ahorros, base), hh.meta_ahorro),
    },
    {
      key: "inversion",
      label: "Inversión",
      valor: t.inversion,
      pct: pct(t.inversion, base),
      meta: hh.meta_inversion,
      semaforo: semaforoMinimo(pct(t.inversion, base), hh.meta_inversion),
    },
    {
      key: "jugar",
      label: "Jugar",
      valor: t.jugar,
      pct: pct(t.jugar, base),
      meta: hh.meta_jugar,
      semaforo: semaforoJugar(pct(t.jugar, base), hh.meta_jugar),
    },
    {
      key: "deuda",
      label: "Deuda",
      valor: t.deuda,
      pct: pct(t.deuda, base),
      meta: hh.meta_deuda,
      semaforo: semaforoMaximo(pct(t.deuda, base), hh.meta_deuda),
    },
    {
      key: "donativos",
      label: "Donativos",
      valor: t.donativos,
      pct: pct(t.donativos, base),
      meta: hh.meta_donativos,
      semaforo: semaforoMinimoSimple(pct(t.donativos, base), hh.meta_donativos),
    },
    {
      key: "formacion",
      label: "Formación",
      valor: t.formacion,
      pct: pct(t.formacion, base),
      meta: hh.meta_formacion,
      semaforo: semaforoMinimoSimple(pct(t.formacion, base), hh.meta_formacion),
    },
  ];
}

/** Salud financiera general (Dashboard General!B13). */
export function saludFinancieraGeneral(
  t: Totales,
  hh: PersonalSpace,
  fondo6Pct: number,
): { nivel: Semaforo; mensaje: string } {
  const gastosPct = pct(t.gastos, t.ingresoDisponible);
  const ahorrosPct = pct(t.ahorros, t.ingresoDisponible);
  const inversionPct = pct(t.inversion, t.ingresoDisponible);
  const jugarPct = pct(t.jugar, t.ingresoDisponible);
  const donativosPct = pct(t.donativos, t.ingresoDisponible);
  const formacionPct = pct(t.formacion, t.ingresoDisponible);

  if (t.balance < 0) {
    return { nivel: "rojo", mensaje: "CRÍTICO: su presupuesto está en déficit. Revise gastos de inmediato." };
  }
  if (
    gastosPct <= hh.meta_gastos &&
    ahorrosPct >= hh.meta_ahorro &&
    inversionPct >= hh.meta_inversion &&
    jugarPct <= hh.meta_jugar &&
    donativosPct >= hh.meta_donativos &&
    formacionPct >= hh.meta_formacion &&
    fondo6Pct >= 0.5
  ) {
    return { nivel: "verde", mensaje: "SALUDABLE: su presupuesto cumple la mayoría de las metas recomendadas." };
  }
  if (gastosPct > hh.meta_gastos * 1.2 || jugarPct > hh.meta_jugar * 1.2) {
    return { nivel: "naranja", mensaje: "EN RIESGO: algunas categorías superan ampliamente su meta." };
  }
  return { nivel: "amarillo", mensaje: "ESTABLE: en camino, con oportunidades de mejora." };
}

// --- Patrimonio Neto ---------------------------------------------------

export function capacidadAhorroReal(t: Totales): number {
  return pct(t.ahorros + t.inversion, t.ingresoDisponible);
}

export type PosicionPatrimonial = "PAR" | "MAR" | "SAR" | null;

/**
 * Método "El Millonario de la Puerta de al Lado" (Stanley & Danko).
 * Patrimonio Deseado = Salario Anual x Edad / 10.
 * PAR >= 2x deseado · MAR entre 0.5x y 2x · SAR <= 0.5x.
 */
export function calcularPosicionPatrimonial(
  salarioAnual: number,
  edad: number | null,
  patrimonioNetoActual: number,
) {
  if (!edad || edad <= 0) {
    return {
      patrimonioDeseado: 0,
      umbralPAR: 0,
      umbralSAR: 0,
      posicion: null as PosicionPatrimonial,
    };
  }
  const patrimonioDeseado = (salarioAnual * edad) / 10;
  const umbralPAR = patrimonioDeseado * 2;
  const umbralSAR = patrimonioDeseado / 2;
  let posicion: PosicionPatrimonial = "SAR";
  if (patrimonioNetoActual >= umbralPAR) posicion = "PAR";
  else if (patrimonioNetoActual >= umbralSAR) posicion = "MAR";
  return { patrimonioDeseado, umbralPAR, umbralSAR, posicion };
}

// --- Fondo de Libertad Financiera --------------------------------------

export function calcularFondoEmergencia(
  t: Totales,
  gastosHogarTotal: number,
  hh: PersonalSpace,
) {
  const gastoMensualReal = t.gastos + gastosHogarTotal + t.deuda;
  const ahorroMensualDisponible = t.ahorros + t.inversion;
  const metaBasico = gastoMensualReal * hh.meses_fondo_basico;
  const metaIdeal = gastoMensualReal * hh.meses_fondo_ideal;
  const pctBasico = metaBasico > 0 ? Math.min(hh.fondo_acumulado / metaBasico, 1) : 0;
  const pctIdeal = metaIdeal > 0 ? Math.min(hh.fondo_acumulado / metaIdeal, 1) : 0;
  const restanteBasico = Math.max(metaBasico - hh.fondo_acumulado, 0);
  const restanteIdeal = Math.max(metaIdeal - hh.fondo_acumulado, 0);
  const mesesBasico =
    ahorroMensualDisponible > 0 ? Math.ceil(restanteBasico / ahorroMensualDisponible) : null;
  const mesesIdeal =
    ahorroMensualDisponible > 0 ? Math.ceil(restanteIdeal / ahorroMensualDisponible) : null;

  return {
    gastoMensualReal,
    ahorroMensualDisponible,
    metaBasico,
    metaIdeal,
    pctBasico,
    pctIdeal,
    restanteBasico,
    restanteIdeal,
    mesesBasico,
    mesesIdeal,
  };
}

// --- Plan de Deudas · Bola de Nieve --------------------------------------

export type MesSnowball = {
  mes: number;
  saldos: number[]; // por deuda, en orden de prioridad (rank)
  totalSaldo: number;
  interesDelMes: number;
};

export type ResultadoSnowball = {
  orden: Deuda[]; // deudas activas ordenadas por prioridad (saldo ascendente)
  meses: MesSnowball[];
  mesesParaLibertad: number | null; // null = no se liquida dentro del horizonte
  interesTotalSnowball: number;
  interesTotalSoloMinimos: number;
  ahorroEnIntereses: number;
};

const HORIZONTE_MESES = 240; // 20 años, límite de seguridad

/** Simula el plan bola de nieve mes a mes, igual que la cuadrícula del Excel. */
export function simularSnowball(
  deudasActivas: Deuda[],
  pagoExtraBase: number,
): ResultadoSnowball {
  const orden = [...deudasActivas].sort((a, b) => a.saldo_actual - b.saldo_actual);
  const n = orden.length;
  let saldos = orden.map((d) => d.saldo_actual);
  const tasas = orden.map((d) => d.tasa_interes_anual);
  const minimos = orden.map((d) => d.cuota_minima);

  const meses: MesSnowball[] = [];
  let interesTotalSnowball = 0;
  let mesesParaLibertad: number | null = null;

  for (let mes = 1; mes <= HORIZONTE_MESES; mes++) {
    if (saldos.every((s) => s <= 0)) {
      mesesParaLibertad = mes - 1;
      break;
    }
    const freedMinimums = minimos.reduce((acc, min, i) => (saldos[i] <= 0 ? acc + min : acc), 0);
    const extraPool = pagoExtraBase + freedMinimums;

    let interesDelMes = 0;
    let targetAsignado = false;
    const nuevosSaldos = saldos.map((saldoPrevio, i) => {
      if (saldoPrevio <= 0) return 0;
      const interes = saldoPrevio * (tasas[i] / 100 / 12);
      interesDelMes += interes;
      const crecido = saldoPrevio + interes;
      const esObjetivo = !targetAsignado; // el primero (más prioritario) que aún debe
      if (esObjetivo) targetAsignado = true;
      const pago = minimos[i] + (esObjetivo ? extraPool : 0);
      return Math.max(crecido - pago, 0);
    });

    saldos = nuevosSaldos;
    interesTotalSnowball += interesDelMes;
    meses.push({
      mes,
      saldos: [...saldos],
      totalSaldo: saldos.reduce((a, b) => a + b, 0),
      interesDelMes,
    });
    if (mes === HORIZONTE_MESES) mesesParaLibertad = null;
  }

  // Interés total si solo se pagaran los mínimos (para comparar el ahorro).
  let interesTotalSoloMinimos = 0;
  for (let i = 0; i < n; i++) {
    let saldo = orden[i].saldo_actual;
    const tasaMensual = tasas[i] / 100 / 12;
    const minimo = minimos[i];
    if (minimo <= 0 || saldo <= 0) continue;
    for (let mes = 1; mes <= HORIZONTE_MESES && saldo > 0; mes++) {
      const interes = saldo * tasaMensual;
      interesTotalSoloMinimos += interes;
      saldo = Math.max(saldo + interes - minimo, 0);
    }
  }

  return {
    orden,
    meses,
    mesesParaLibertad,
    interesTotalSnowball,
    interesTotalSoloMinimos,
    ahorroEnIntereses: Math.max(interesTotalSoloMinimos - interesTotalSnowball, 0),
  };
}

// --- Formato -------------------------------------------------------------

/** Formatea un monto en la moneda indicada. CRC se redondea; USD lleva 2 decimales. */
export function formatoMoneda(valor: number, moneda: Moneda = "CRC"): string {
  const signo = valor < 0 ? "-" : "";
  const abs = Math.abs(Number(valor) || 0);
  if (moneda === "USD") {
    return `${signo}$ ${abs.toLocaleString("es-CR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${signo}₡ ${Math.round(abs).toLocaleString("es-CR")}`;
}

/** @deprecated usar formatoMoneda(valor, moneda). Se mantiene como alias en CRC. */
export function formatoColones(valor: number): string {
  return formatoMoneda(valor, "CRC");
}

export function formatoPct(valor: number): string {
  return `${(valor * 100).toFixed(1)}%`;
}

export const MESES_LABEL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
