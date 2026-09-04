"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatoMoneda } from "@/lib/calculations";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { EditableValueRow } from "@/components/patrimonio/EditableValueRow";
import { useT } from "@/components/i18n/I18nProvider";
import type { CurrencyConfig } from "@/lib/currency";
import type { Moneda } from "@/lib/types";
import { Plus } from "lucide-react";

type Item = { id: string; concepto: string; valor: number; moneda: Moneda };

export function ValueListCard({
  title,
  items,
  total,
  totalColor,
  currency,
  addAction,
  updateAction,
  deleteAction,
}: {
  title: string;
  items: Item[];
  total: number;
  totalColor: "green" | "red";
  currency: CurrencyConfig;
  addAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className={`text-sm font-semibold ${totalColor === "green" ? "text-green" : "text-red"}`}>
          {formatoMoneda(total, currency.primaria)}
        </span>
      </CardHeader>
      <CardBody>
        <ul className="divide-y divide-border mb-3">
          {items.length === 0 && (
            <li className="text-sm text-gray-400 py-2">{t("valueList.noRecords")}</li>
          )}
          {items.map((item) => (
            <EditableValueRow
              key={item.id}
              item={item}
              currency={currency}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))}
        </ul>
        <form action={addAction} className="flex flex-wrap items-center gap-2">
          <input
            name="concepto"
            placeholder={t("common.concepto")}
            required
            className="flex-1 min-w-[8rem] rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
          <MontoConMoneda
            name="valor"
            activas={currency.activas}
            primaria={currency.primaria}
            placeholder={t("common.valor")}
            required
            montoClassName="w-40"
          />
          <button
            type="submit"
            className="shrink-0 bg-navy text-white rounded-lg p-2 hover:bg-navy-light"
            aria-label={t("common.add")}
          >
            <Plus size={16} />
          </button>
        </form>
      </CardBody>
    </Card>
  );
}
