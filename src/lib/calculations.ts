// ============================================================================
// Finéfica · Presupuesto — motor de cálculo
// Cada fórmula aquí es la traducción directa de las fórmulas del libro de
// Excel original. Se documenta la celda/hoja de origen para poder auditar.
// ============================================================================
import type {
  BudgetItem,
  Categoria,
  CategoriaTipo,
  Deuda,
  PersonalBudgetCategory,
  PersonalSpace,
  Moneda,
  Semaforo,
} from "./types";

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
  /** total por `clave` de categoría (moneda primaria) del mes */
  porCategoria: Record<string, number>;
  totalMaximo: number; // Σ categorías tipo "maximo"
  totalMinimo: number; // Σ categorías tipo "minimo"
  totalAsignado: number; // Σ de todas las categorías
  deuda: number; // suma de cuotas mínimas de deudas activas
  aporteFamiliar: number; // aporte al Presupuesto Familiar (resta en balance)
  balance: number; // Presupuesto!E104
};

export function calcularTotales(
  items: BudgetItem[],
  deudas: Deuda[],
  categorias: PersonalBudgetCategory[],
  mes: number,
  anio: number,
  /** Aporte al Presupuesto Familiar. No se pega a ninguna categoría; resta en el balance. */
  aporteFamiliar = 0,
): Totales {
  const sumClave = (clave: string) =>
    items
      .filter((i) => i.mes === mes && i.anio === anio && i.categoria === clave)
      .reduce((acc, i) => acc + Number(i.monto || 0), 0);

  const ingresos = sumClave("ingresos");
  const rebajos = sumClave("rebajos");
  const ingresoDisponible = ingresos - rebajos;

  const porCategoria: Record<string, number> = {};
  let totalMaximo = 0;
  let totalMinimo = 0;
  let totalAsignado = 0;
  for (const c of categorias) {
    const v = sumClave(c.clave);
    porCategoria[c.clave] = v;
    totalAsignado += v;
    if (c.tipo === "maximo") totalMaximo += v;
    else totalMinimo += v;
  }

  const deuda = deudas
    .filter((d) => d.estado === "Activa")
    .reduce((acc, d) => acc + Number(d.cuota_minima || 0), 0);

  const ap = Number(aporteFamiliar) || 0;
  const balance = ingresoDisponible - totalAsignado - deuda - ap;

  return {
    ingresos,
    rebajos,
    ingresoDisponible,
    porCategoria,
    totalMaximo,
    totalMinimo,
    totalAsignado,
    deuda,
    aporteFamiliar: ap,
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

/** Ahorros / Inversión y demás: tipo "mínimo", 4 niveles. */
export function semaforoMinimo(pctValor: number, meta: number): Semaforo {
  if (pctValor >= meta) return "verde";
  if (pctValor >= meta * (2 / 3)) return "amarillo";
  if (pctValor >= meta * (1 / 3)) return "naranja";
  return "rojo";
}

/** Semáforo de una categoría según su tipo. `meta <= 0` → no se evalúa (verde). */
export function semaforoCategoria(
  pctValor: number,
  meta: number,
  tipo: CategoriaTipo,
): Semaforo {
  if (meta <= 0) return "verde";
  return tipo === "maximo" ? semaforoMaximo(pctValor, meta) : semaforoMinimo(pctValor, meta);
}

/** Balance (Presupuesto!I104). */
export function semaforoBalance(balance: number, ingresoDisponible: number): Semaforo {
  const p = pct(balance, ingresoDisponible);
  if (balance < -0.01 * Math.max(ingresoDisponible, 1)) return "rojo";
  if (p >= -0.01 && p <= 0.01) return "verde";
  return "amarillo";
}

export type SemaforoCategoria = {
  key: string; // clave de la categoría, o "deuda"
  label: string; // nombre visible
  tipo: CategoriaTipo;
  valor: number;
  pct: number;
  meta: number;
  semaforo: Semaforo;
};

/** Semáforo por categoría dinámica + la fila derivada de Deuda. */
export function calcularSemaforos(
  t: Totales,
  categorias: PersonalBudgetCategory[],
  metaDeuda: number,
  deudaLabel: string,
): SemaforoCategoria[] {
  const base = t.ingresoDisponible;
  const rows: SemaforoCategoria[] = categorias.map((c) => {
    const valor = t.porCategoria[c.clave] ?? 0;
    const p = pct(valor, base);
    return {
      key: c.clave,
      label: c.nombre,
      tipo: c.tipo,
      valor,
      pct: p,
      meta: c.meta,
      semaforo: semaforoCategoria(p, c.meta, c.tipo),
    };
  });
  const pd = pct(t.deuda, base);
  rows.push({
    key: "deuda",
    label: deudaLabel,
    tipo: "maximo",
    valor: t.deuda,
    pct: pd,
    meta: metaDeuda,
    semaforo: semaforoCategoria(pd, metaDeuda, "maximo"),
  });
  return rows;
}

/** Salud financiera general. Devuelve una clave de i18n. */
export function saludFinancieraGeneral(
  t: Totales,
  categorias: PersonalBudgetCategory[],
  metaDeuda: number,
  fondo6Pct: number,
): { nivel: Semaforo; mensajeKey: "salud.deficit" | "salud.saludable" | "salud.riesgo" | "salud.estable" } {
  if (t.balance < 0) {
    return { nivel: "rojo", mensajeKey: "salud.deficit" };
  }

  const base = t.ingresoDisponible;
  const cumple = (valor: number, meta: number, tipo: CategoriaTipo) => {
    if (meta <= 0) return true;
    const p = pct(valor, base);
    return tipo === "maximo" ? p <= meta : p >= meta;
  };
  const sobrepasa = (valor: number, meta: number, tipo: CategoriaTipo) =>
    tipo === "maximo" && meta > 0 && pct(valor, base) > meta * 1.2;

  const todasOk =
    categorias.every((c) => cumple(t.porCategoria[c.clave] ?? 0, c.meta, c.tipo)) &&
    cumple(t.deuda, metaDeuda, "maximo") &&
    fondo6Pct >= 0.5;
  if (todasOk) {
    return { nivel: "verde", mensajeKey: "salud.saludable" };
  }

  const algunaMaximoAlta =
    categorias.some((c) => sobrepasa(t.porCategoria[c.clave] ?? 0, c.meta, c.tipo)) ||
    sobrepasa(t.deuda, metaDeuda, "maximo");
  if (algunaMaximoAlta) {
    return { nivel: "naranja", mensajeKey: "salud.riesgo" };
  }
  return { nivel: "amarillo", mensajeKey: "salud.estable" };
}

// --- Patrimonio Neto ---------------------------------------------------

export function capacidadAhorroReal(t: Totales): number {
  return pct(t.totalMinimo, t.ingresoDisponible);
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
  const gastoMensualReal = t.totalMaximo + t.aporteFamiliar + gastosHogarTotal + t.deuda;
  const ahorroMensualDisponible = t.totalMinimo;
  const metaBasico = gastoMensualReal * hh.meses_fondo_basico;
  const metaIdeal = gastoMensualReal * hh.meses_fondo_ideal;
  const pctBasicoReal = metaBasico > 0 ? hh.fondo_acumulado / metaBasico : 0;
  const pctIdealReal = metaIdeal > 0 ? hh.fondo_acumulado / metaIdeal : 0;
  const pctBasico = Math.min(pctBasicoReal, 1); // para la barra (no se desborda)
  const pctIdeal = Math.min(pctIdealReal, 1);
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
    pctBasicoReal,
    pctIdealReal,
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
  capitalDelMes: number; // reducción de capital total ese mes
};

export type ResultadoSnowball = {
  orden: Deuda[]; // deudas activas ordenadas por prioridad (saldo ascendente)
  meses: MesSnowball[];
  mesesParaLibertad: number | null; // null = no se liquida dentro del horizonte
  interesTotalSnowball: number;
  interesTotalSoloMinimos: number;
  ahorroEnIntereses: number;
  /** Nº de mes (1-based) en que cada deuda de `orden` llega a 0; null si no dentro del horizonte. */
  mesLiquidacionPorDeuda: (number | null)[];
};

const HORIZONTE_MESES = 240; // 20 años, límite de seguridad

/** Simula el plan bola de nieve mes a mes, igual que la cuadrícula del Excel. */
export function simularSnowball(
  deudasActivas: Deuda[],
  pagoExtraBase: number,
): ResultadoSnowball {
  // Supabase devuelve `numeric` como string; forzamos números para evitar
  // concatenaciones ("500" + 0 = "5000").
  const extra = Number(pagoExtraBase) || 0;
  const orden = [...deudasActivas].sort((a, b) => Number(a.saldo_actual) - Number(b.saldo_actual));
  const n = orden.length;
  let saldos = orden.map((d) => Number(d.saldo_actual) || 0);
  const tasas = orden.map((d) => Number(d.tasa_interes_anual) || 0);
  const minimos = orden.map((d) => Number(d.cuota_minima) || 0);

  const meses: MesSnowball[] = [];
  let interesTotalSnowball = 0;
  let mesesParaLibertad: number | null = null;
  const mesLiquidacionPorDeuda: (number | null)[] = orden.map(() => null);

  for (let mes = 1; mes <= HORIZONTE_MESES; mes++) {
    if (saldos.every((s) => s <= 0)) {
      mesesParaLibertad = mes - 1;
      break;
    }
    const totalAntes = saldos.reduce((a, b) => a + b, 0);
    const freedMinimums = minimos.reduce((acc, min, i) => (saldos[i] <= 0 ? acc + min : acc), 0);
    const extraPool = extra + freedMinimums;

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
    saldos.forEach((s, i) => {
      if (s <= 0 && mesLiquidacionPorDeuda[i] === null) mesLiquidacionPorDeuda[i] = mes;
    });
    interesTotalSnowball += interesDelMes;
    const totalDespues = saldos.reduce((a, b) => a + b, 0);
    meses.push({
      mes,
      saldos: [...saldos],
      totalSaldo: totalDespues,
      interesDelMes,
      capitalDelMes: Math.max(totalAntes + interesDelMes - totalDespues, 0),
    });
    if (mes === HORIZONTE_MESES) mesesParaLibertad = null;
  }

  // Interés total si solo se pagaran los mínimos (para comparar el ahorro).
  let interesTotalSoloMinimos = 0;
  for (let i = 0; i < n; i++) {
    let saldo = Number(orden[i].saldo_actual) || 0;
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
    mesLiquidacionPorDeuda,
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
