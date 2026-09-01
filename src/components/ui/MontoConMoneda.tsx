import type { Moneda } from "@/lib/types";
import { MONEDAS } from "@/lib/types";

const INPUT_CLASS =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-light/40 focus:border-navy-light";

/**
 * Selector de moneda para un formulario de monto. Si el hogar tiene una sola
 * moneda activa, renderiza un input oculto con esa moneda (sin UI). Si tiene
 * dos, muestra un `<select>` con la moneda primaria como opción por defecto.
 */
export function MonedaSelect({
  name = "moneda",
  activas,
  primaria,
  defaultMoneda,
  className = "",
}: {
  name?: string;
  activas: Moneda[];
  primaria: Moneda;
  defaultMoneda?: Moneda;
  className?: string;
}) {
  if (activas.length < 2) {
    return <input type="hidden" name={name} value={activas[0] ?? primaria} />;
  }
  return (
    <select
      name={name}
      defaultValue={defaultMoneda ?? primaria}
      aria-label="Moneda"
      className={`${INPUT_CLASS} ${className}`}
    >
      {MONEDAS.filter((m) => activas.includes(m.code)).map((m) => (
        <option key={m.code} value={m.code}>
          {m.symbol} {m.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Input de monto + selector de moneda, para los formularios de una sola cifra
 * (líneas de presupuesto, activos, pasivos). Presentacional: no usa hooks ni
 * APIs de servidor, así que puede usarse dentro de componentes cliente.
 */
export function MontoConMoneda({
  name = "monto",
  monedaName = "moneda",
  activas,
  primaria,
  defaultMonto,
  defaultMoneda,
  step = "0.01",
  required = false,
  placeholder = "Monto",
  montoClassName = "",
  wrapperClassName = "flex items-center gap-2",
}: {
  name?: string;
  monedaName?: string;
  activas: Moneda[];
  primaria: Moneda;
  defaultMonto?: number | string;
  defaultMoneda?: Moneda;
  step?: string;
  required?: boolean;
  placeholder?: string;
  montoClassName?: string;
  wrapperClassName?: string;
}) {
  return (
    <div className={wrapperClassName}>
      <input
        name={name}
        type="number"
        step={step}
        inputMode="decimal"
        placeholder={placeholder}
        required={required}
        defaultValue={defaultMonto}
        className={`${INPUT_CLASS} ${montoClassName || "w-28"}`}
      />
      <MonedaSelect
        name={monedaName}
        activas={activas}
        primaria={primaria}
        defaultMoneda={defaultMoneda}
      />
    </div>
  );
}
