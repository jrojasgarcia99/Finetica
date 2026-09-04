"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useT } from "@/components/i18n/I18nProvider";
import { IconPickerField } from "./IconPicker";
import type { Envelope, EnvelopeIconName } from "@/lib/types";

/** Ventana para editar un sobre: nombre, ícono, meta ilimitada o presupuesto. */
export function EnvelopeEditDialog({
  open,
  onClose,
  envelope,
  action,
}: {
  open: boolean;
  onClose: () => void;
  envelope: Envelope;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [icono, setIcono] = useState<EnvelopeIconName>(envelope.icono as EnvelopeIconName);
  const [ilimitado, setIlimitado] = useState(envelope.limite_ilimitado);
  const sym = envelope.moneda === "USD" ? "$" : "₡";

  return (
    <Sheet open={open} onClose={onClose} title={t("sobres.editEnvelope")}>
      <form
        action={async (fd) => {
          await action(fd);
          onClose();
        }}
        className="space-y-4 p-5"
      >
        <input type="hidden" name="id" value={envelope.id} />
        <input type="hidden" name="icono" value={icono} />

        <Field label={t("sobres.name")}>
          <Input name="nombre" defaultValue={envelope.nombre} required />
        </Field>

        <IconPickerField value={icono} onChange={setIcono} label={t("sobres.icon")} />

        <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 has-[:checked]:border-navy">
          <span className="text-sm font-medium text-gray-700">{t("sobres.unlimitedGoal")}</span>
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
            <input
              type="checkbox"
              name="limite_ilimitado"
              defaultChecked={envelope.limite_ilimitado}
              onChange={(e) => setIlimitado(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-navy" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        {!ilimitado && (
          <Field label={t("sobres.limit", { sym })}>
            <MoneyInput name="limite_mensual" defaultValue={envelope.limite_mensual} required />
          </Field>
        )}

        <Button type="submit" className="w-full">
          {t("common.save")}
        </Button>
      </form>
    </Sheet>
  );
}
