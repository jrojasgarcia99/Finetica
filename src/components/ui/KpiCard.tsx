import { Card } from "./Card";

export function KpiCard({
  label,
  value,
  accent = "navy",
  sub,
}: {
  label: string;
  value: string;
  accent?: "navy" | "green" | "red" | "gold";
  sub?: string;
}) {
  const accentClass = {
    navy: "text-navy",
    green: "text-green",
    red: "text-red",
    gold: "text-gold",
  }[accent];

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}
