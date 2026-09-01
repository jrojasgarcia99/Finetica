"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Moneda } from "@/lib/types";
import { MONEDAS } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";

export function MonedasCard({
  activas,
  primaria,
  action,
}: {
  activas: Moneda[];
  primaria: Moneda;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [checked, setChecked] = useState<Record<Moneda, boolean>>({
    CRC: activas.includes("CRC"),
    USD: activas.includes("USD"),
  });
  const [prim, setPrim] = useState<Moneda>(primaria);
  const t = useT();

  const activeList = MONEDAS.filter((m) => checked[m.code]).map((m) => m.code);
  const ambas = activeList.length === 2;

  function toggle(code: Moneda) {
    setChecked((prev) => {
      const next = { ...prev, [code]: !prev[code] };
      // Nunca dejar cero monedas activas.
      if (!next.CRC && !next.USD) return prev;
      // Si la primaria quedó desactivada, moverla a la que sigue activa.
      if (!next[prim]) {
        const otra = (Object.keys(next) as Moneda[]).find((k) => next[k]);
        if (otra) setPrim(otra);
      }
      return next;
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("monedas.title")}</CardTitle>
      </CardHeader>
      <CardBody>
        <form action={action} className="space-y-5">
          <div>
            <p className="text-sm font-medium text-navy mb-3">{t("monedas.activeCurrencies")}</p>
            <div className="flex flex-wrap gap-4">
              {MONEDAS.map((m) => (
                <label key={m.code} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="activas"
                    value={m.code}
                    checked={checked[m.code]}
                    onChange={() => toggle(m.code)}
                    className="h-4 w-4 rounded border-border accent-navy"
                  />
                  <span>
                    {m.symbol} {t(`moneda.${m.code}`)}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t("monedas.atLeastOne")}
            </p>
          </div>

          {ambas && (
            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium text-navy mb-3">
                {t("monedas.primaryCurrency")}
              </p>
              <p className="text-xs text-gray-400 mb-3">
                {t("monedas.primaryDesc")}
              </p>
              <div className="flex flex-wrap gap-4">
                {MONEDAS.filter((m) => checked[m.code]).map((m) => (
                  <label key={m.code} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="moneda_primaria"
                      value={m.code}
                      checked={prim === m.code}
                      onChange={() => setPrim(m.code)}
                      className="h-4 w-4 border-border accent-navy"
                    />
                    <span>
                      {m.symbol} {t(`moneda.${m.code}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!ambas && (
            <input type="hidden" name="moneda_primaria" value={activeList[0] ?? "CRC"} />
          )}

          <div className="flex justify-end">
            <Button type="submit">{t("monedas.save")}</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
