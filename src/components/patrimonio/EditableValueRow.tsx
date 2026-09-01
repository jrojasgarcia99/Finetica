"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { formatoMoneda } from "@/lib/calculations";
import { aPrimaria, type CurrencyConfig } from "@/lib/currency";
import type { Moneda } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";

type Item = { id: string; concepto: string; valor: number; moneda: Moneda };

export function EditableValueRow({
  item,
  currency,
  updateAction,
  deleteAction,
}: {
  item: Item;
  currency: CurrencyConfig;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const enPrimaria = aPrimaria(item.valor, item.moneda, currency);
  const esSecundaria =
    (item.moneda === "CRC" || item.moneda === "USD") && item.moneda !== currency.primaria;

  if (editing) {
    return (
      <li className="py-2">
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
            name="valor"
            activas={currency.activas}
            primaria={currency.primaria}
            defaultMonto={item.valor}
            defaultMoneda={item.moneda}
            required
            montoClassName="w-32"
          />
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
    <li className="flex items-center justify-between py-2 text-sm">
      <span className="text-gray-700">{item.concepto}</span>
      <div className="flex items-center gap-3">
        <span className="text-gray-600">
          {formatoMoneda(enPrimaria, currency.primaria)}
          {esSecundaria && (
            <span className="ml-1.5 text-xs text-gray-400">
              · {formatoMoneda(item.valor, item.moneda)}
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
