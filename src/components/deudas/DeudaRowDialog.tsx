"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MonedaSelect } from "@/components/ui/MontoConMoneda";
import { useT } from "@/components/i18n/I18nProvider";
import type { CurrencyConfig } from "@/lib/currency";
import type { Deuda } from "@/lib/types";

/** Ventana para editar (o eliminar) una deuda. */
export function DeudaRowDialog({
  open,
  onClose,
  deuda,
  currency,
  updateAction,
  deleteAction,
}: {
  open: boolean;
  onClose: () => void;
  deuda: Deuda;
  currency: CurrencyConfig;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title={t("deudas.editDebt")}>
      <form
        action={async (fd) => {
          await updateAction(fd);
          onClose();
        }}
        className="space-y-4 p-5"
      >
        <input type="hidden" name="id" value={deuda.id} />

        <Field label={t("deudas.name")}>
          <Input name="nombre" defaultValue={deuda.nombre} required />
        </Field>
        <Field label={t("deudas.institution")}>
          <Input name="institucion" defaultValue={deuda.institucion ?? ""} />
        </Field>
        <Field label={t("deudas.startDate")}>
          <Input type="date" name="fecha_inicio" defaultValue={deuda.fecha_inicio ?? ""} />
        </Field>
        {currency.activas.length > 1 ? (
          <Field label={t("common.currency")}>
            <MonedaSelect
              activas={currency.activas}
              primaria={currency.primaria}
              defaultMoneda={deuda.moneda}
              className="w-full"
            />
          </Field>
        ) : (
          <MonedaSelect
            activas={currency.activas}
            primaria={currency.primaria}
            defaultMoneda={deuda.moneda}
          />
        )}
        <Field label={t("deudas.originalAmount")}>
          <Input type="number" step="0.01" name="monto_original" defaultValue={deuda.monto_original} required />
        </Field>
        <Field label={t("deudas.currentBalance")}>
          <Input type="number" step="0.01" name="saldo_actual" defaultValue={deuda.saldo_actual} required />
        </Field>
        <Field label={t("deudas.annualRate")}>
          <Input type="number" step="0.01" name="tasa_interes_anual" defaultValue={deuda.tasa_interes_anual} required />
        </Field>
        <Field label={t("deudas.minInstallment")}>
          <Input type="number" step="0.01" name="cuota_minima" defaultValue={deuda.cuota_minima} required />
        </Field>

        <Button type="submit" className="w-full">
          {t("common.save")}
        </Button>
      </form>

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
          title={t("deudas.editDebt")}
          message={t("deudas.deleteDebtConfirm")}
          onCancel={() => setConfirmDel(false)}
          onConfirm={async () => {
            const fd = new FormData();
            fd.set("id", deuda.id);
            await deleteAction(fd);
            setConfirmDel(false);
            onClose();
          }}
        />
      </div>
    </Sheet>
  );
}
