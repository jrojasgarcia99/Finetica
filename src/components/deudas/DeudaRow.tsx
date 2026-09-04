"use client";

import { useState } from "react";
import { formatoMoneda } from "@/lib/calculations";
import { aPrimaria, type CurrencyConfig } from "@/lib/currency";
import type { Deuda } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";
import { DeudaRowDialog } from "./DeudaRowDialog";

export type DeudaResumen = {
  pagado: number;
  pctPagado: number;
  interesPagado: number;
  mesFin: string | null;
};

export function DeudaRow({
  deuda,
  currency,
  rank,
  paid = false,
  resumen,
  updateAction,
  deleteAction,
  toggleAction,
}: {
  deuda: Deuda;
  currency: CurrencyConfig;
  rank: number | null;
  paid?: boolean;
  resumen?: DeudaResumen;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  toggleAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const fmtP = (v: number) => formatoMoneda(v, currency.primaria);
  const esSecundaria =
    (deuda.moneda === "CRC" || deuda.moneda === "USD") && deuda.moneda !== currency.primaria;
  const saldoPrim = aPrimaria(Number(deuda.saldo_actual), deuda.moneda, currency);
  const cuotaPrim = aPrimaria(Number(deuda.cuota_minima), deuda.moneda, currency);

  const money = (enPrimaria: number, original: number) => (
    <>
      {formatoMoneda(enPrimaria, currency.primaria)}
      {esSecundaria && (
        <span className="block text-xs text-gray-400">
          · {formatoMoneda(original, deuda.moneda)}
        </span>
      )}
    </>
  );

  return (
    <>
      <tr
        onClick={() => setOpen(true)}
        className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-gray-50 ${
          paid ? "opacity-50" : ""
        }`}
      >
        <td className="py-2.5 pr-3 font-medium text-navy">{rank ?? "—"}</td>
        <td className="py-2.5 pr-3">
          <span className={paid ? "line-through" : ""}>{deuda.nombre}</span>
          {deuda.institucion && !paid && (
            <span className="text-gray-400"> · {deuda.institucion}</span>
          )}
        </td>
        <td className="py-2.5 pr-3">{money(saldoPrim, Number(deuda.saldo_actual))}</td>
        <td className="py-2.5 pr-3">
          {resumen ? (
            <>
              {fmtP(resumen.pagado)}
              <span className="block text-xs text-gray-400">
                {(resumen.pctPagado * 100).toFixed(0)}%
              </span>
            </>
          ) : (
            "—"
          )}
        </td>
        <td className="py-2.5 pr-3 text-red">{resumen ? fmtP(resumen.interesPagado) : "—"}</td>
        <td className="py-2.5 pr-3">{deuda.tasa_interes_anual}%</td>
        <td className="py-2.5 pr-3">{money(cuotaPrim, Number(deuda.cuota_minima))}</td>
        <td className="py-2.5 pr-3 text-gray-500">{resumen?.mesFin ?? "—"}</td>
        <td className="py-2.5 pr-3">
          <form action={toggleAction} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="id" value={deuda.id} />
            <input type="hidden" name="estado" value={deuda.estado} />
            <button
              type="submit"
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                paid ? "bg-gray-200 text-gray-500" : "bg-green/10 text-green"
              }`}
            >
              {t(deuda.estado === "Activa" ? "deudas.statusActive" : "deudas.statusPaid")}
            </button>
          </form>
        </td>
      </tr>

      {open && (
        <DeudaRowDialog
          open={open}
          onClose={() => setOpen(false)}
          deuda={deuda}
          currency={currency}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      )}
    </>
  );
}
