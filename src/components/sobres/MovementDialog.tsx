"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import type { EnvelopeMovement, Moneda } from "@/lib/types";

/**
 * Ventana (bottom sheet en móvil, modal en escritorio) para registrar o editar
 * un movimiento de sobre. Si viene `mv` es edición y muestra "Eliminar" al final.
 */
export function MovementDialog({
  open,
  onClose,
  moneda,
  paymentMethods,
  today,
  envelopeId,
  mv,
  action,
  deleteAction,
}: {
  open: boolean;
  onClose: () => void;
  moneda: Moneda;
  paymentMethods: string[];
  today: string;
  envelopeId?: string;
  mv?: EnvelopeMovement;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const isEdit = !!mv;
  const sym = moneda === "USD" ? "$" : "₡";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const methodOptions =
    mv?.metodo_pago && !paymentMethods.includes(mv.metodo_pago)
      ? [mv.metodo_pago, ...paymentMethods]
      : paymentMethods;

  const INPUT_BIG = "py-2.5 text-base";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up motion-reduce:animate-none flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[var(--radius-card)] bg-card shadow-[var(--shadow-card)] pb-[env(safe-area-inset-bottom)] sm:rounded-[var(--radius-card)] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-base font-semibold text-navy">
            {isEdit ? t("sobres.editMovement") : t("sobres.addMovement")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-navy"
          >
            <X size={22} />
          </button>
        </div>

        <form
          action={async (fd) => {
            await action(fd);
            onClose();
          }}
          className="space-y-4 p-5"
        >
          {isEdit ? (
            <input type="hidden" name="id" value={mv!.id} />
          ) : (
            <input type="hidden" name="envelope_id" value={envelopeId} />
          )}

          <Field label={t("sobres.description")}>
            <Input
              name="descripcion"
              required
              defaultValue={mv?.descripcion}
              className={INPUT_BIG}
            />
          </Field>

          <Field label={t("sobres.type")}>
            <Select name="tipo" defaultValue={mv?.tipo ?? "expense"} className={INPUT_BIG}>
              <option value="expense">{t("sobres.expense")}</option>
              <option value="income">{t("sobres.income")}</option>
            </Select>
          </Field>

          <Field label={`${t("sobres.amount")} (${sym})`}>
            <MoneyInput
              name="monto"
              required
              defaultValue={mv?.monto}
              className={INPUT_BIG}
            />
          </Field>

          <Field label={t("sobres.date")}>
            <Input
              type="date"
              name="fecha"
              defaultValue={mv?.fecha ?? today}
              className={INPUT_BIG}
            />
          </Field>

          <Field label={t("sobres.paymentMethod")}>
            <Select
              name="metodo_pago"
              defaultValue={mv?.metodo_pago ?? ""}
              className={INPUT_BIG}
            >
              <option value="">—</option>
              {methodOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <Button type="submit" className="w-full py-3 text-base">
            {t("common.save")}
          </Button>
        </form>

        {isEdit && deleteAction && (
          <div className="border-t border-border p-5 pt-4">
            <form
              action={async (fd) => {
                await deleteAction(fd);
                onClose();
              }}
              onSubmit={(e) => {
                if (!confirm(t("sobres.deleteMovementConfirm"))) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={mv!.id} />
              <button
                type="submit"
                className="w-full rounded-full border border-red/30 py-2.5 text-sm font-medium text-red transition-colors hover:bg-red/5"
              >
                {t("common.delete")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
