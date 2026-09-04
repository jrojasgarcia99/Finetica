"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import { MONEDAS, type Moneda } from "@/lib/types";
import { IconPickerField } from "./IconPicker";
import type { EnvelopeIconName } from "@/lib/types";

export type LineOption = {
  id: string;
  label: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
};

export function EnvelopeForm({
  action,
  hasFamily,
  personalLines,
  familyLines,
  personalActivas,
  personalPrimaria,
  familyActivas,
  familyPrimaria,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hasFamily: boolean;
  personalLines: LineOption[];
  familyLines: LineOption[];
  personalActivas: Moneda[];
  personalPrimaria: Moneda;
  familyActivas: Moneda[];
  familyPrimaria: Moneda;
}) {
  const t = useT();

  const [scope, setScope] = useState<"personal" | "family">("personal");
  const lines = scope === "family" ? familyLines : personalLines;
  const activas = scope === "family" ? familyActivas : personalActivas;
  const primaria = scope === "family" ? familyPrimaria : personalPrimaria;

  const first = lines[0];
  const [sourceId, setSourceId] = useState(first?.id ?? "");
  const [nombre, setNombre] = useState(first?.concepto ?? "");
  const [limite, setLimite] = useState(first ? String(first.monto) : "");
  const [moneda, setMoneda] = useState<Moneda>(first?.moneda ?? primaria);
  const [icono, setIcono] = useState<EnvelopeIconName>("Wallet");

  function applyLine(list: LineOption[], id: string, fallbackMoneda: Moneda) {
    const l = list.find((x) => x.id === id);
    setSourceId(id);
    setNombre(l?.concepto ?? "");
    setLimite(l ? String(l.monto) : "");
    setMoneda(l?.moneda ?? fallbackMoneda);
  }

  function changeScope(next: "personal" | "family") {
    setScope(next);
    const list = next === "family" ? familyLines : personalLines;
    const prim = next === "family" ? familyPrimaria : personalPrimaria;
    applyLine(list, list[0]?.id ?? "", prim);
  }

  const monedaOpts = MONEDAS.filter((m) => activas.includes(m.code));

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {hasFamily ? (
        <Field label={t("sobres.scope")}>
          <Select
            name="scope"
            value={scope}
            onChange={(e) => changeScope(e.target.value === "family" ? "family" : "personal")}
          >
            <option value="personal">{t("sobres.scopePersonal")}</option>
            <option value="family">{t("sobres.scopeFamily")}</option>
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="scope" value="personal" />
      )}

      {lines.length === 0 ? (
        <p className="text-sm text-gray-500 sm:col-span-2">
          {t("sobres.noLines")}{" "}
          <Link
            href={scope === "family" ? "/familiar" : "/presupuesto"}
            className="text-navy-light hover:underline"
          >
            {scope === "family" ? t("nav.familiar") : t("nav.presupuesto")}
          </Link>
          .
        </p>
      ) : (
        <>
          <Field label={t("sobres.sourceLine")} hint={t("tip.sobreSource")}>
            <Select
              name="source_line_id"
              value={sourceId}
              onChange={(e) => applyLine(lines, e.target.value, primaria)}
              required
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("sobres.name")}>
            <Input
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Field>

          <Field label={t("sobres.limit", { sym: moneda === "USD" ? "$" : "₡" })}>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="limite_mensual"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              required
            />
          </Field>

          <Field label={t("common.currency")}>
            <Select
              name="moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value === "USD" ? "USD" : "CRC")}
            >
              {monedaOpts.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.symbol} {m.code}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("sobres.resetCycle")} hint={t("tip.sobreReset")}>
            <Select name="reinicio_dia" defaultValue="">
              <option value="">{t("sobres.resetEndOfMonth")}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {t("sobres.resetDay", { d })}
                </option>
              ))}
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <input type="hidden" name="icono" value={icono} />
            <IconPickerField value={icono} onChange={setIcono} label={t("sobres.icon")} />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">{t("sobres.createEnvelope")}</Button>
          </div>
        </>
      )}
    </form>
  );
}
