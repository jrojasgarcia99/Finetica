"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useT } from "@/components/i18n/I18nProvider";
import { ENVELOPE_ICON_GROUPS, EnvelopeIcon } from "./envelope-icons";
import type { EnvelopeIconName } from "@/lib/types";

/** Ventana con los íconos de sobre agrupados por categoría, para elegir uno. */
export function IconPickerSheet({
  open,
  onClose,
  value,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onSelect: (name: EnvelopeIconName) => void;
}) {
  const t = useT();

  return (
    <Sheet open={open} onClose={onClose} title={t("sobres.chooseIcon")}>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
        {ENVELOPE_ICON_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t(group.labelKey)}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {group.icons.map((name) => {
                const selected = name === value;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onSelect(name);
                      onClose();
                    }}
                    aria-pressed={selected}
                    aria-label={name}
                    className={`grid aspect-square place-items-center rounded-xl border transition-colors ${
                      selected
                        ? "border-navy bg-navy text-white"
                        : "border-border bg-white text-gray-500 hover:border-navy-light"
                    }`}
                  >
                    <EnvelopeIcon name={name} size={20} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/** Campo "Ícono": muestra el actual y abre `IconPickerSheet` para cambiarlo. */
export function IconPickerField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (name: EnvelopeIconName) => void;
  label: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p className="mb-1 block text-xs font-medium text-gray-500">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 transition-colors hover:border-navy-light"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy text-white">
          <EnvelopeIcon name={value} size={18} />
        </span>
        <span className="text-sm font-medium text-navy">{t("sobres.changeIcon")}</span>
      </button>
      <IconPickerSheet open={open} onClose={() => setOpen(false)} value={value} onSelect={onChange} />
    </div>
  );
}
