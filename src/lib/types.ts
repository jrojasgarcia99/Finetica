export type Moneda = "CRC" | "USD";

export const MONEDAS: { code: Moneda; symbol: string; label: string }[] = [
  { code: "CRC", symbol: "₡", label: "Colones" },
  { code: "USD", symbol: "$", label: "Dólares" },
];

export type Categoria =
  | "ingresos"
  | "rebajos"
  | "gastos"
  | "ahorros"
  | "inversion"
  | "jugar"
  | "donativos"
  | "formacion";

export const CATEGORIAS: { key: Categoria; label: string }[] = [
  { key: "ingresos", label: "Ingresos" },
  { key: "rebajos", label: "Rebajos (deducciones)" },
  { key: "gastos", label: "Gastos" },
  { key: "ahorros", label: "Ahorros" },
  { key: "inversion", label: "Inversión" },
  { key: "jugar", label: "Jugar" },
  { key: "donativos", label: "Donativos" },
  { key: "formacion", label: "Formación" },
];

/**
 * Espacio personal privado de una cuenta. Reemplaza al viejo `households`
 * compartido: 1 fila por usuario, con su perfil (nombre + salario) y toda la
 * configuración (monedas, metas, fondo, tipo de cambio…).
 */
export type PersonalSpace = {
  id: string;
  owner_id: string;
  display_name: string;
  salario_mensual: number;
  created_at: string;
  tipo_cambio: number;
  moneda_primaria: Moneda;
  monedas_activas: Moneda[];
  meta_gastos: number;
  meta_ahorro: number;
  meta_inversion: number;
  meta_jugar: number;
  meta_donativos: number;
  meta_formacion: number;
  meta_deuda: number;
  meses_fondo_basico: number;
  meses_fondo_ideal: number;
  fondo_acumulado: number;
  pago_extra_base: number;
  patrimonio_edad: number | null;
};

/** Presupuesto Familiar compartido (opcional). Tiene su propia config de monedas. */
export type FamilyBudget = {
  id: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
  tipo_cambio: number;
  moneda_primaria: Moneda;
  monedas_activas: Moneda[];
};

/** Miembro de un Presupuesto Familiar, con datos de perfil traídos de su espacio personal. */
export type FamilyBudgetMember = {
  id: string;
  family_budget_id: string;
  user_id: string;
  joined_at: string;
  display_name: string;
  salario_mensual: number;
};

export type FamilyBudgetCategory = {
  id: string;
  family_budget_id: string;
  nombre: string;
  orden: number;
  created_at: string;
};

export type FamilyBudgetItem = {
  id: string;
  family_budget_id: string;
  categoria: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
  automatico: boolean;
  mes: number;
  anio: number;
  created_by: string | null;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  space_id: string;
  categoria: Categoria;
  concepto: string;
  monto: number;
  moneda: Moneda;
  automatico: boolean;
  mes: number;
  anio: number;
  created_by: string | null;
  created_at: string;
};

export type Activo = {
  id: string;
  space_id: string;
  concepto: string;
  valor: number;
  moneda: Moneda;
  created_at: string;
};

export type Pasivo = {
  id: string;
  space_id: string;
  concepto: string;
  valor: number;
  moneda: Moneda;
  created_at: string;
};

export type EstadoDeuda = "Activa" | "Pagada";

export type Deuda = {
  id: string;
  space_id: string;
  nombre: string;
  institucion: string | null;
  monto_original: number;
  saldo_actual: number;
  tasa_interes_anual: number;
  cuota_minima: number;
  moneda: Moneda;
  fecha_inicio: string | null;
  estado: EstadoDeuda;
  created_at: string;
};

/** Categorías por defecto de un Presupuesto Familiar nuevo. */
export const FAMILY_CATEGORIAS_DEFAULT = [
  "Vivienda",
  "Servicios Públicos",
  "Supermercado",
  "Transporte del Hogar",
  "Mantenimiento",
  "Seguros del Hogar",
  "Otros",
] as const;

export type Semaforo = "verde" | "amarillo" | "naranja" | "rojo";

export const SEMAFORO_LABEL: Record<Semaforo, string> = {
  verde: "Excelente",
  amarillo: "Atención",
  naranja: "Riesgo",
  rojo: "Crítico",
};

export const SEMAFORO_COLOR: Record<Semaforo, string> = {
  verde: "#2E7D32",
  amarillo: "#C9A227",
  naranja: "#C0703A",
  rojo: "#B3261E",
};
