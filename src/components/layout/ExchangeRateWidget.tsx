"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import type { Moneda } from "@/lib/types";
import { simbolo } from "@/lib/currency";

export function ExchangeRateWidget({
  primaria,
  secundaria,
  tipoCambio,
  updateAction,
  tone = "light",
}: {
  primaria: Moneda;
  secundaria: Moneda | null;
  tipoCambio: number;
  updateAction: (formData: FormData) => void | Promise<void>;
  /** "light" para el fijo de escritorio; "dark" para la barra superior móvil (navy). */
  tone?: "light" | "dark";
}) {
  const [editing, setEditing] = useState(false);

  if (!secundaria) return null;

  const dark = tone === "dark";
  const shell = dark
    ? "bg-white/10 text-white"
    : "bg-white border border-border text-navy shadow-sm";
  const sinTC = !tipoCambio || tipoCambio <= 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${shell}`}
    >
      <span className={dark ? "text-white/70" : "text-gray-500"}>
        {simbolo(secundaria)} 1 =
      </span>

      {editing ? (
        <form
          action={updateAction}
          onSubmit={() => setEditing(false)}
          className="flex items-center gap-1"
        >
          <span className={dark ? "text-white/70" : "text-gray-500"}>
            {simbolo(primaria)}
          </span>
          <input
            name="tipo_cambio"
            type="number"
            step="0.0001"
            min="0"
            inputMode="decimal"
            autoFocus
            defaultValue={tipoCambio || ""}
            className="w-20 rounded border border-border bg-white px-1.5 py-0.5 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy-light"
          />
          <button
            type="submit"
            aria-label="Guardar tipo de cambio"
            className={dark ? "text-white/80 hover:text-white" : "text-green hover:opacity-80"}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Cancelar"
            className={dark ? "text-white/60 hover:text-white" : "text-gray-400 hover:text-gray-600"}
          >
            <X size={14} />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5"
          aria-label="Editar tipo de cambio"
          title="Editar tipo de cambio"
        >
          <span className={sinTC ? (dark ? "text-gold-light" : "text-orange") : ""}>
            {simbolo(primaria)}{" "}
            {sinTC
              ? "sin definir"
              : tipoCambio.toLocaleString("es-CR", { maximumFractionDigits: 4 })}
          </span>
          <Pencil size={12} className={dark ? "text-white/60" : "text-gray-400"} />
        </button>
      )}
    </div>
  );
}
