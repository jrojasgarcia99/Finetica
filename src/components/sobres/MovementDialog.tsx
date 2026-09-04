"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useT } from "@/components/i18n/I18nProvider";
import type { EnvelopeMovement, Moneda } from "@/lib/types";

/**
 * Ventana para registrar o editar un movimiento de sobre. Si viene `mv` es
 * edición y muestra "Eliminar" al final (con confirmación dentro de la app).
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
  const [confirmDel, setConfirmDel] = useState(false);

  const methodOptions =
    mv?.metodo_pago && !paymentMethods.includes(mv.metodo_pago)
      ? [mv.metodo_pago, ...paymentMethods]
      : paymentMethods;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? t("sobres.editMovement") : t("sobres.addMovement")}
    >
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
          <Input name="descripcion" required defaultValue={mv?.descripcion} />
        </Field>

        <Field label={t("sobres.type")}>
          <Select name="tipo" defaultValue={mv?.tipo ?? "expense"}>
            <option value="expense">{t("sobres.expense")}</option>
            <option value="income">{t("sobres.income")}</option>
          </Select>
        </Field>

        <Field label={`${t("sobres.amount")} (${sym})`}>
          <MoneyInput name="monto" required defaultValue={mv?.monto} />
        </Field>

        <Field label={t("sobres.date")}>
          <Input type="date" name="fecha" defaultValue={mv?.fecha ?? today} />
        </Field>

        <Field label={t("sobres.paymentMethod")}>
          <Select name="metodo_pago" defaultValue={mv?.metodo_pago ?? ""}>
            <option value="">—</option>
            {methodOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" className="w-full">
          {t("common.save")}
        </Button>
      </form>

      {isEdit && deleteAction && (
        <div className="border-t border-border p-5 pt-4">
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="w-full rounded-full border border-red/30 py-2.5 text-[15px] font-medium text-red transition-colors hover:bg-red/5"
          >
            {t("common.delete")}
          </button>
          <ConfirmDialog
            open={confirmDel}
            title={t("sobres.editMovement")}
            message={t("sobres.deleteMovementConfirm")}
            onCancel={() => setConfirmDel(false)}
            onConfirm={async () => {
              const fd = new FormData();
              fd.set("id", mv!.id);
              await deleteAction(fd);
              setConfirmDel(false);
              onClose();
            }}
          />
        </div>
      )}
    </Sheet>
  );
}
