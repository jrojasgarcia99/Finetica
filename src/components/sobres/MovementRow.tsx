"use client";

import { useState } from "react";
import { formatoMoneda } from "@/lib/calculations";
import { useLocale } from "@/components/i18n/I18nProvider";
import { MovementDialog } from "./MovementDialog";
import type { EnvelopeMovement, Moneda } from "@/lib/types";

/**
 * Fila de un movimiento. Al tocarla se abre la ventana de edición (con la
 * opción de eliminar). El monto va en rojo si es gasto y verde si es ingreso;
 * el método de pago cuelga debajo del monto, a la derecha.
 */
export function MovementRow({
  mv,
  moneda,
  paymentMethods,
  today,
  updateAction,
  deleteAction,
}: {
  mv: EnvelopeMovement;
  moneda: Moneda;
  paymentMethods: string[];
  today: string;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const isExpense = mv.tipo === "expense";
  const fmt = (v: number) => formatoMoneda(v, moneda);
  const fechaLabel = new Date(`${mv.fecha}T00:00:00`).toLocaleDateString(
    locale === "en" ? "en-US" : "es-CR",
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-navy-light active:scale-[0.99]"
      >
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-navy">{mv.descripcion}</p>
          <p className="mt-0.5 text-sm text-gray-400">{fechaLabel}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`text-base font-semibold ${isExpense ? "text-red" : "text-green"}`}
          >
            {fmt(Number(mv.monto))}
          </span>
          {mv.metodo_pago && (
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
              {mv.metodo_pago}
            </span>
          )}
        </div>
      </button>

      <MovementDialog
        open={open}
        onClose={() => setOpen(false)}
        moneda={moneda}
        paymentMethods={paymentMethods}
        today={today}
        mv={mv}
        action={updateAction}
        deleteAction={deleteAction}
      />
    </>
  );
}
