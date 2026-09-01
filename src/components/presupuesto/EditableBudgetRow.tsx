"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil, Check, X, RefreshCw, CalendarClock, GripVertical } from "lucide-react";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { formatoMoneda } from "@/lib/calculations";
import { aPrimaria, type CurrencyConfig } from "@/lib/currency";
import { useT } from "@/components/i18n/I18nProvider";
import type { Moneda } from "@/lib/types";

export type BudgetRowItem = {
  id: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
  automatico: boolean;
  recurrente: boolean;
};

export function EditableBudgetRow({
  item,
  currency,
  updateAction,
  deleteAction,
}: {
  item: BudgetRowItem;
  currency: CurrencyConfig;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const enPrimaria = aPrimaria(item.monto, item.moneda, currency);
  const esSecundaria =
    (item.moneda === "CRC" || item.moneda === "USD") && item.moneda !== currency.primaria;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: editing });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} className="py-2">
        <form
          action={updateAction}
          onSubmit={() => setEditing(false)}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="id" value={item.id} />
          <input
            name="concepto"
            defaultValue={item.concepto}
            required
            className="flex-1 min-w-[8rem] rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
          <MontoConMoneda
            activas={currency.activas}
            primaria={currency.primaria}
            defaultMonto={item.monto}
            defaultMoneda={item.moneda}
            required
          />
          <label
            title={t("cat.recurringTitle")}
            className="flex h-9 cursor-pointer select-none items-center gap-1 rounded-lg border border-border px-2 text-gray-500 has-[:checked]:border-green has-[:checked]:text-green"
          >
            <input type="checkbox" name="recurrente" defaultChecked={item.recurrente} className="sr-only" />
            <RefreshCw size={15} />
          </label>
          <label
            title={t("cat.automaticTitle")}
            className="flex h-9 cursor-pointer select-none items-center gap-1 rounded-lg border border-border px-2 text-gray-500 has-[:checked]:border-gold has-[:checked]:text-gold"
          >
            <input type="checkbox" name="automatico" defaultChecked={item.automatico} className="sr-only" />
            <CalendarClock size={15} />
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-navy p-2 text-white hover:bg-navy-light"
            aria-label={t("common.save")}
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-lg border border-border p-2 text-gray-500 hover:bg-gray-50"
            aria-label={t("common.cancel")}
          >
            <X size={16} />
          </button>
        </form>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-2 py-2 text-sm ${
        item.recurrente ? "border-l-2 border-green pl-2" : ""
      }`}
    >
      <span
        className={`flex min-w-0 items-center gap-1.5 ${
          item.recurrente ? "font-medium text-green" : "text-gray-700"
        }`}
      >
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          aria-label={t("cat.dragHandle")}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        {item.recurrente && (
          <RefreshCw size={13} className="shrink-0" aria-label={t("cat.recurring")} />
        )}
        {item.automatico && (
          <CalendarClock
            size={13}
            className="shrink-0 text-gold"
            aria-label={t("cat.automatic")}
          />
        )}
        <span className="truncate">{item.concepto}</span>
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <span className={item.recurrente ? "text-green" : "text-gray-600"}>
          {formatoMoneda(enPrimaria, currency.primaria)}
          {esSecundaria && (
            <span className="ml-1.5 text-xs text-gray-400">
              · {formatoMoneda(item.monto, item.moneda)}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-gray-300 transition-colors hover:text-navy"
          aria-label={t("common.edit")}
        >
          <Pencil size={14} />
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="text-gray-300 transition-colors hover:text-red"
            aria-label={t("common.delete")}
          >
            <Trash2 size={14} />
          </button>
        </form>
      </div>
    </li>
  );
}
