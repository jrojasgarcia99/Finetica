"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MonedaSelect } from "@/components/ui/MontoConMoneda";
import { useT } from "@/components/i18n/I18nProvider";
import type { Moneda } from "@/lib/types";
import { ENVELOPE_ICON_NAMES, EnvelopeIcon } from "./envelope-icons";

type CatOption = { value: string; label: string };

export function EnvelopeForm({
  action,
  hasFamily,
  personalCats,
  familyCats,
  personalActivas,
  personalPrimaria,
  familyActivas,
  familyPrimaria,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hasFamily: boolean;
  personalCats: CatOption[];
  familyCats: CatOption[];
  personalActivas: Moneda[];
  personalPrimaria: Moneda;
  familyActivas: Moneda[];
  familyPrimaria: Moneda;
}) {
  const t = useT();
  const [scope, setScope] = useState<"personal" | "family">("personal");
  const [icono, setIcono] = useState<string>("Wallet");

  const isFamily = scope === "family";
  const cats = isFamily ? familyCats : personalCats;
  const activas = isFamily ? familyActivas : personalActivas;
  const primaria = isFamily ? familyPrimaria : personalPrimaria;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label={t("sobres.name")}>
        <Input name="nombre" required placeholder={t("sobres.namePh")} />
      </Field>

      {hasFamily ? (
        <Field label={t("sobres.scope")}>
          <Select
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value === "family" ? "family" : "personal")}
          >
            <option value="personal">{t("sobres.scopePersonal")}</option>
            <option value="family">{t("sobres.scopeFamily")}</option>
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="scope" value="personal" />
      )}

      <Field label={t("sobres.category")}>
        <Select name="categoria" required key={scope}>
          {cats.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("common.currency")}>
        <MonedaSelect
          key={scope}
          activas={activas}
          primaria={primaria}
          className="w-full"
        />
      </Field>

      <Field label={t("sobres.limit", { sym: primaria === "USD" ? "$" : "₡" })}>
        <Input type="number" step="0.01" min="0" name="limite_mensual" required />
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
        <p className="mb-1 block text-xs font-medium text-gray-500">{t("sobres.icon")}</p>
        <input type="hidden" name="icono" value={icono} />
        <div className="flex flex-wrap gap-2">
          {ENVELOPE_ICON_NAMES.map((name) => {
            const selected = name === icono;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setIcono(name)}
                aria-pressed={selected}
                aria-label={name}
                className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
                  selected
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-gray-500 hover:border-navy-light"
                }`}
              >
                <EnvelopeIcon name={name} size={17} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit">{t("sobres.createEnvelope")}</Button>
      </div>
    </form>
  );
}
