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

export function BalanceChart({
  data,
}: {
  data: { label: string; balance: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [
            `₡ ${Number(value).toLocaleString("es-CR")}`,
            "Balance",
          ]}
          contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#1f3864"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#1f3864" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
