"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useT } from "@/components/i18n/I18nProvider";
import { IconPickerField } from "./IconPicker";
import { UnlimitedToggle } from "./UnlimitedToggle";
import { ResetCycleField } from "./ResetCycleField";
import type { Envelope, EnvelopeIconName } from "@/lib/types";

/** Ventana para editar un sobre: nombre, ícono, meta ilimitada o presupuesto,
 *  y el ciclo de reinicio. */
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
  const cicloDefault = envelope.sin_reinicio
    ? "none"
    : envelope.reinicio_dia != null
      ? String(envelope.reinicio_dia)
      : "";

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

        <UnlimitedToggle defaultChecked={envelope.limite_ilimitado} onChange={setIlimitado} />

        {!ilimitado && (
          <Field label={t("sobres.limit", { sym })}>
            <MoneyInput name="limite_mensual" defaultValue={envelope.limite_mensual} required />
          </Field>
        )}

        <ResetCycleField defaultValue={cicloDefault} />

        <Button type="submit" className="w-full">
          {t("common.save")}
        </Button>
      </form>
    </Sheet>
  );
}
