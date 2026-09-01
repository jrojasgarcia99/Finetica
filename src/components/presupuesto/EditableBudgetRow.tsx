"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X, Repeat } from "lucide-react";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { formatoMoneda } from "@/lib/calculations";
import { aPrimaria, type CurrencyConfig } from "@/lib/currency";
import type { Moneda } from "@/lib/types";

type Item = {
  id: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
  automatico: boolean;
};

export function EditableBudgetRow({
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
  const [editing, setEditing] = useState(false);
  const enPrimaria = aPrimaria(item.monto, item.moneda, currency);
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
            activas={currency.activas}
            primaria={currency.primaria}
            defaultMonto={item.monto}
            defaultMoneda={item.moneda}
            required
          />
          <label className="flex select-none items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
            <input
              type="checkbox"
              name="automatico"
              defaultChecked={item.automatico}
              className="h-4 w-4 rounded border-border accent-green"
            />
            <Repeat size={13} />
            Automático
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-navy p-2 text-white hover:bg-navy-light"
            aria-label="Guardar"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-lg border border-border p-2 text-gray-500 hover:bg-gray-50"
            aria-label="Cancelar"
          >
            <X size={16} />
          </button>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex items-center justify-between py-2 text-sm ${
        item.automatico ? "border-l-2 border-green pl-2" : ""
      }`}
    >
      <span
        className={`flex items-center gap-1.5 ${
          item.automatico ? "font-medium text-green" : "text-gray-700"
        }`}
      >
        {item.automatico && (
          <Repeat size={13} className="shrink-0" aria-label="Movimiento automático" />
        )}
        {item.concepto}
      </span>
      <div className="flex items-center gap-3">
        <span className={item.automatico ? "text-green" : "text-gray-600"}>
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
          aria-label="Editar"
        >
          <Pencil size={14} />
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="text-gray-300 transition-colors hover:text-red"
            aria-label="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </form>
      </div>
    </li>
  );
}
