import { Card } from "./Card";
import { InfoHint } from "@/components/ui/Tooltip";

export function KpiCard({
  label,
  value,
  accent = "navy",
  sub,
  hint,
}: {
  label: string;
  value: string;
  accent?: "navy" | "green" | "red" | "gold";
  sub?: string;
  hint?: React.ReactNode;
}) {
  const accentClass = {
    navy: "text-navy",
    green: "text-green",
    red: "text-red",
    gold: "text-gold",
  }[accent];

  return (
    <Card className="p-4">
      <p className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
        {hint && <InfoHint content={hint} />}
      </p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}
