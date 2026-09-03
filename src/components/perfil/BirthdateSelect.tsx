"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Input";
import { mesesLabel } from "@/lib/i18n";
import { useLocale, useT } from "@/components/i18n/I18nProvider";

const MIN_AGE = 15;
const MAX_AGE = 100;

/** Día / Mes / Año en tres listas. El año arranca 15 años atrás (edad mínima).
 *  Escribe `fecha_nacimiento` como YYYY-MM-DD en un input oculto. */
export function BirthdateSelect({
  name = "fecha_nacimiento",
  defaultValue,
}: {
  name?: string;
  defaultValue?: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const MES = mesesLabel(locale);
  const now = new Date();
  const maxYear = now.getFullYear() - MIN_AGE;
  const minYear = now.getFullYear() - MAX_AGE;

  const p = (defaultValue ?? "").split("-");
  const [y, setY] = useState(p[0] || "");
  const [m, setM] = useState(p[1] ? String(Number(p[1])) : "");
  const [d, setD] = useState(p[2] ? String(Number(p[2])) : "");

  const daysInMonth = y && m ? new Date(Number(y), Number(m), 0).getDate() : 31;
  const iso = y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";

  return (
    <div className="grid grid-cols-3 gap-2">
      <input type="hidden" name={name} value={iso} />
      <Select
        aria-label={t("date.day")}
        value={d}
        onChange={(e) => setD(e.target.value)}
        required
      >
        <option value="" disabled>
          {t("date.day")}
        </option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("date.month")}
        value={m}
        onChange={(e) => {
          const nm = e.target.value;
          setM(nm);
          const dim = y && nm ? new Date(Number(y), Number(nm), 0).getDate() : 31;
          if (Number(d) > dim) setD("");
        }}
        required
      >
        <option value="" disabled>
          {t("date.month")}
        </option>
        {MES.map((label, i) => (
          <option key={i} value={i + 1}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        aria-label={t("date.year")}
        value={y}
        onChange={(e) => setY(e.target.value)}
        required
      >
        <option value="" disabled>
          {t("date.year")}
        </option>
        {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    </div>
  );
}
