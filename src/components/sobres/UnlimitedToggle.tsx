"use client";

import { useT } from "@/components/i18n/I18nProvider";

/**
 * Switch "Ilimitado, sin meta mensual". Uncontrolled (`defaultChecked`) para
 * que el valor siempre llegue al Server Action; `onChange` sólo actualiza la
 * UI del formulario que lo usa (mostrar/ocultar el campo de presupuesto).
 */
export function UnlimitedToggle({
  defaultChecked,
  onChange,
}: {
  defaultChecked: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useT();
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 has-[:checked]:border-navy">
      <span className="text-sm font-medium text-gray-700">
        {t("sobres.unlimitedGoal")}
        <span className="block text-xs font-normal text-gray-400">
          {t("sobres.unlimitedGoalHint")}
        </span>
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          name="limite_ilimitado"
          defaultChecked={defaultChecked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-navy" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
