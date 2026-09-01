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

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  tipo_cambio: number;
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

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  display_name: string;
  salario_mensual: number;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  household_id: string;
  categoria: Categoria;
  concepto: string;
  monto: number;
  mes: number;
  anio: number;
  created_by: string | null;
  created_at: string;
};

export type Activo = {
  id: string;
  household_id: string;
  concepto: string;
  valor: number;
  created_at: string;
};

export type Pasivo = {
  id: string;
  household_id: string;
  concepto: string;
  valor: number;
  created_at: string;
};

export type EstadoDeuda = "Activa" | "Pagada";

export type Deuda = {
  id: string;
  household_id: string;
  nombre: string;
  institucion: string | null;
  monto_original: number;
  saldo_actual: number;
  tasa_interes_anual: number;
  cuota_minima: number;
  fecha_inicio: string | null;
  estado: EstadoDeuda;
  created_at: string;
};

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
