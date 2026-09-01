"use client";

import type { Moneda } from "@/lib/types";
import { MONEDAS } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";

const INPUT_CLASS =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-light/40 focus:border-navy-light";

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
  const t = useT();
  if (activas.length < 2) {
    return <input type="hidden" name={name} value={activas[0] ?? primaria} />;
  }
  return (
    <select
      name={name}
      defaultValue={defaultMoneda ?? primaria}
      aria-label={t("common.currency")}
      className={`${INPUT_CLASS} ${className}`}
    >
      {MONEDAS.filter((m) => activas.includes(m.code)).map((m) => (
        <option key={m.code} value={m.code}>
          {m.symbol} {t(`moneda.${m.code}`)}
        </option>
      ))}
    </select>
  );
}

export function MontoConMoneda({
  name = "monto",
  monedaName = "moneda",
  activas,
  primaria,
  defaultMonto,
  defaultMoneda,
  step = "0.01",
  required = false,
  placeholder,
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
  const t = useT();
  return (
    <div className={wrapperClassName}>
      <input
        name={name}
        type="number"
        step={step}
        inputMode="decimal"
        placeholder={placeholder ?? t("common.monto")}
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
