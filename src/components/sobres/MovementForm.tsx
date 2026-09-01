"use client";

import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import type { Moneda } from "@/lib/types";

export function MovementForm({
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
  const sym = moneda === "USD" ? "$" : "₡";

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="envelope_id" value={envelopeId} />

      <Field label={t("sobres.description")}>
        <Input name="descripcion" required />
      </Field>

      <Field label={t("sobres.type")}>
        <Select name="tipo" defaultValue="expense">
          <option value="expense">{t("sobres.expense")}</option>
          <option value="income">{t("sobres.income")}</option>
        </Select>
      </Field>

      <Field label={`${t("sobres.amount")} (${sym})`}>
        <Input type="number" step="0.01" min="0" inputMode="decimal" name="monto" required />
      </Field>

      <Field label={t("sobres.date")}>
        <Input type="date" name="fecha" defaultValue={today} />
      </Field>

      <Field label={t("sobres.paymentMethod")}>
        <Select name="metodo_pago" defaultValue="">
          <option value="">—</option>
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Button type="submit">{t("sobres.addMovement")}</Button>
      </div>
    </form>
  );
}
