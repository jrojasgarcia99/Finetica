"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Moneda } from "@/lib/types";
import { simbolo } from "@/lib/currency";

export function BalanceChart({
  data,
  moneda = "CRC",
}: {
  data: { label: string; balance: number }[];
  moneda?: Moneda;
}) {
  const sym = simbolo(moneda);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--foreground)" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--foreground)" }}
          tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [
            `${sym} ${Number(value).toLocaleString("es-CR")}`,
            "Balance",
          ]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="var(--chart-line)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--chart-line)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
