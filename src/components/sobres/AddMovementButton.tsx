"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { MovementDialog } from "./MovementDialog";
import type { Moneda } from "@/lib/types";

/** Botón `+` que abre la ventana para registrar un movimiento. */
export function AddMovementButton({
  envelopeId,
  moneda,
  paymentMethods,
  today,
  action,
}: {
  envelopeId: string;
  moneda: Moneda;
  paymentMethods: string[];
  today: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("sobres.addMovement")}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-white transition-transform hover:scale-105 active:scale-95"
      >
        <Plus size={22} />
      </button>
      <MovementDialog
        open={open}
        onClose={() => setOpen(false)}
        envelopeId={envelopeId}
        moneda={moneda}
        paymentMethods={paymentMethods}
        today={today}
        action={action}
      />
    </>
  );
}
