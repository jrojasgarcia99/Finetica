"use client";

import { useRef, useState } from "react";

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-navy-light/40 focus:border-navy-light";

/** "1234567.89" → "1.234.567,89" (locale es-CR: punto para miles, coma decimal). */
export function toDisplay(clean: string): string {
  if (!clean) return "";
  const neg = clean.startsWith("-");
  const body = clean.replace("-", "");
  const dot = body.indexOf(".");
  let intPart = dot === -1 ? body : body.slice(0, dot);
  const decPart = dot === -1 ? null : body.slice(dot + 1);
  intPart = intPart.replace(/^0+(?=\d)/, "");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const out = decPart === null ? grouped : `${grouped || "0"},${decPart}`;
  return (neg ? "-" : "") + out;
}

/** Cualquier texto → número limpio tipo JS ("1234567.89"), sin separadores de miles. */
export function toClean(raw: string): string {
  let s = (raw || "").replace(/[^\d.,-]/g, "");
  const neg = s.startsWith("-");
  s = s.replace(/-/g, "");
  // La coma es el separador decimal; los puntos son de miles.
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    const intp = s.slice(0, firstComma).replace(/[.,]/g, "");
    const decp = s.slice(firstComma + 1).replace(/[.,]/g, "");
    s = decp ? `${intp}.${decp}` : `${intp}.`;
  } else {
    s = s.replace(/\./g, "");
  }
  return (neg ? "-" : "") + s;
}

/**
 * Campo de monto que muestra separadores de miles es-CR mientras se teclea
 * (`1000000` → `1.000.000`) pero envía en el formulario el número limpio, sin
 * puntos, listo para `Number(...)`. El valor viaja en un `<input hidden>` con el
 * `name`; el campo visible es sólo presentación.
 */
export function MoneyInput({
  name,
  defaultValue,
  required = false,
  placeholder,
  className = "",
  id,
  "aria-label": ariaLabel,
}: {
  name: string;
  defaultValue?: number | string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const initClean =
    defaultValue === undefined || defaultValue === null || defaultValue === ""
      ? ""
      : String(Number(defaultValue));
  const [display, setDisplay] = useState(() => toDisplay(initClean));
  const ref = useRef<HTMLInputElement>(null);

  const clean = toClean(display);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = el.value.slice(0, caret).replace(/\D/g, "").length;

    const next = toDisplay(toClean(el.value));
    setDisplay(next);

    // Reponer el cursor tras la misma cantidad de dígitos que había a su izquierda.
    requestAnimationFrame(() => {
      const node = ref.current;
      if (!node) return;
      let pos = next.length;
      if (digitsBefore > 0) {
        let seen = 0;
        for (let i = 0; i < next.length; i++) {
          if (/\d/.test(next[i])) seen++;
          if (seen === digitsBefore) {
            pos = i + 1;
            break;
          }
        }
      }
      node.setSelectionRange(pos, pos);
    });
  }

  return (
    <>
      <input type="hidden" name={name} value={clean} />
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        aria-label={ariaLabel}
        value={display}
        onChange={handleChange}
        onBlur={() => setDisplay(toDisplay(toClean(display)))}
        className={`${INPUT_CLASS} ${className}`}
      />
    </>
  );
}
