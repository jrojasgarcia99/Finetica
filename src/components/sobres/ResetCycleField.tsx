"use client";

import { Field, Select } from "@/components/ui/Input";
import { useT } from "@/components/i18n/I18nProvider";

/**
 * Selector de ciclo de reinicio: "no reiniciar", fin de mes, o un día fijo.
 * `defaultValue`: "none" | "" (fin de mes) | "1".."31".
 */
export function ResetCycleField({ defaultValue }: { defaultValue: string }) {
  const t = useT();
  return (
    <Field label={t("sobres.resetCycle")} hint={t("tip.sobreReset")}>
      <Select name="reinicio_dia" defaultValue={defaultValue}>
        <option value="none">{t("sobres.resetNever")}</option>
        <option value="">{t("sobres.resetEndOfMonth")}</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {t("sobres.resetDay", { d })}
          </option>
        ))}
      </Select>
    </Field>
  );
}
