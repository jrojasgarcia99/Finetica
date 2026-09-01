"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { Moneda } from "@/lib/types";
import { simbolo } from "@/lib/currency";
import { useT, useLocale } from "@/components/i18n/I18nProvider";

export type DebtChartPoint = {
  label: string;
  saldo: number;
  interes: number;
  capital: number;
};

export function DeudaCharts({
  data,
  moneda = "CRC",
}: {
  data: DebtChartPoint[];
  moneda?: Moneda;
}) {
  const t = useT();
  const numLocale = useLocale() === "en" ? "en-US" : "es-CR";
  const sym = simbolo(moneda);
  const money = (v: number) => `${sym} ${Math.round(Number(v)).toLocaleString(numLocale)}`;

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">{t("deudas.noChartData")}</p>;
  }

  const tooltipStyle = {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    fontSize: 13,
  } as const;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          {t("deudas.chartBalanceTitle")}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--foreground)" }} interval="preserveStartEnd" />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [money(Number(value)), t("deudas.colRemaining")]}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="var(--chart-line)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          {t("deudas.chartSplitTitle")}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--foreground)" }} interval="preserveStartEnd" />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [
                money(Number(value)),
                name === "interes" ? t("deudas.interest") : t("deudas.principal"),
              ]}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Legend
              formatter={(v) => (v === "interes" ? t("deudas.interest") : t("deudas.principal"))}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="interes" stackId="a" fill="var(--red)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="capital" stackId="a" fill="var(--green)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
