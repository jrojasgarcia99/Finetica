"use client";

import { useState } from "react";
import { Trash2, Pencil, X } from "lucide-react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MonedaSelect } from "@/components/ui/MontoConMoneda";
import { formatoMoneda } from "@/lib/calculations";
import { aPrimaria, type CurrencyConfig } from "@/lib/currency";
import type { Deuda } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";

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
  const [editing, setEditing] = useState(false);
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

  if (editing) {
    return (
      <tr className="border-b border-border bg-gray-50/60">
        <td colSpan={10} className="py-3">
          <form
            action={updateAction}
            onSubmit={() => setEditing(false)}
            className="grid sm:grid-cols-3 gap-3"
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
              <Input
                type="number"
                step="0.01"
                name="monto_original"
                defaultValue={deuda.monto_original}
                required
              />
            </Field>
            <Field label={t("deudas.currentBalance")}>
              <Input
                type="number"
                step="0.01"
                name="saldo_actual"
                defaultValue={deuda.saldo_actual}
                required
              />
            </Field>
            <Field label={t("deudas.annualRate")}>
              <Input
                type="number"
                step="0.01"
                name="tasa_interes_anual"
                defaultValue={deuda.tasa_interes_anual}
                required
              />
            </Field>
            <Field label={t("deudas.minInstallment")}>
              <Input
                type="number"
                step="0.01"
                name="cuota_minima"
                defaultValue={deuda.cuota_minima}
                required
              />
            </Field>
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit">{t("common.saveChanges")}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                <X size={16} /> {t("common.cancel")}
              </Button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b border-border last:border-0 ${paid ? "opacity-50" : ""}`}>
      <td className="py-2 pr-3 font-medium text-navy">{rank ?? "—"}</td>
      <td className="py-2 pr-3">
        <span className={paid ? "line-through" : ""}>{deuda.nombre}</span>
        {deuda.institucion && !paid && (
          <span className="text-gray-400"> · {deuda.institucion}</span>
        )}
      </td>
      <td className="py-2 pr-3">{money(saldoPrim, Number(deuda.saldo_actual))}</td>
      <td className="py-2 pr-3">
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
      <td className="py-2 pr-3 text-red">{resumen ? fmtP(resumen.interesPagado) : "—"}</td>
      <td className="py-2 pr-3">{deuda.tasa_interes_anual}%</td>
      <td className="py-2 pr-3">{money(cuotaPrim, Number(deuda.cuota_minima))}</td>
      <td className="py-2 pr-3 text-gray-500">{resumen?.mesFin ?? "—"}</td>
      <td className="py-2 pr-3">
        <form action={toggleAction}>
          <input type="hidden" name="id" value={deuda.id} />
          <input type="hidden" name="estado" value={deuda.estado} />
          <button
            type="submit"
            className={`text-xs rounded-full px-2 py-1 font-medium ${
              paid ? "bg-gray-200 text-gray-500" : "bg-green/10 text-green"
            }`}
          >
            {t(deuda.estado === "Activa" ? "deudas.statusActive" : "deudas.statusPaid")}
          </button>
        </form>
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-gray-300 hover:text-navy"
            aria-label={t("common.edit")}
          >
            <Pencil size={14} />
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={deuda.id} />
            <button type="submit" className="text-gray-300 hover:text-red" aria-label={t("common.delete")}>
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
