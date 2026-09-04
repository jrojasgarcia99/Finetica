"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatoMoneda } from "@/lib/calculations";
import { Input, Select } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import { useT, useLocale } from "@/components/i18n/I18nProvider";
import type { EnvelopeMovement, Moneda } from "@/lib/types";

export function MovementRow({
  mv,
  moneda,
  paymentMethods,
  updateAction,
  deleteAction,
}: {
  mv: EnvelopeMovement;
  moneda: Moneda;
  paymentMethods: string[];
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);

  const isExpense = mv.tipo === "expense";
  const fmt = (v: number) => formatoMoneda(v, moneda);
  const fechaLabel = new Date(`${mv.fecha}T00:00:00`).toLocaleDateString(
    locale === "en" ? "en-US" : "es-CR",
    { day: "numeric", month: "short" },
  );

  const methodOptions =
    mv.metodo_pago && !paymentMethods.includes(mv.metodo_pago)
      ? [mv.metodo_pago, ...paymentMethods]
      : paymentMethods;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy">{mv.descripcion}</p>
          <p className="mt-0.5 text-xs text-gray-400">{fechaLabel}</p>
          {mv.metodo_pago && (
            <span className="mt-1 inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
              {mv.metodo_pago}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`text-sm font-semibold ${isExpense ? "text-navy" : "text-green"}`}
          >
            {isExpense ? "−" : "+"}
            {fmt(Number(mv.monto))}
          </span>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-navy"
            aria-label={t("common.edit")}
          >
            <Pencil size={16} />
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={mv.id} />
            <button
              type="submit"
              className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-red"
              aria-label={t("common.delete")}
            >
              <Trash2 size={16} />
            </button>
          </form>
        </div>
      </div>

      {editing && (
        <form
          action={async (fd) => {
            await updateAction(fd);
            setEditing(false);
          }}
          className="mt-3 grid gap-2 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={mv.id} />
          <Input name="descripcion" defaultValue={mv.descripcion} required />
          <Select name="tipo" defaultValue={mv.tipo}>
            <option value="expense">{t("sobres.expense")}</option>
            <option value="income">{t("sobres.income")}</option>
          </Select>
          <MoneyInput name="monto" defaultValue={mv.monto} required />
          <Input type="date" name="fecha" defaultValue={mv.fecha} />
          <Select name="metodo_pago" defaultValue={mv.metodo_pago ?? ""}>
            <option value="">—</option>
            {methodOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
