import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SemaforoBadge, ProgressBar } from "@/components/ui/Semaforo";
import { SEMAFORO_COLOR, type Categoria, type Moneda, type Semaforo } from "@/lib/types";
import { formatoMoneda, formatoPct } from "@/lib/calculations";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { EditableBudgetRow } from "@/components/presupuesto/EditableBudgetRow";
import type { CurrencyConfig } from "@/lib/currency";
import { addBudgetItem, updateBudgetItem, deleteBudgetItem } from "@/app/(app)/presupuesto/actions";
import { Plus, Repeat, Users } from "lucide-react";
import Link from "next/link";

type Item = {
  id: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
  automatico: boolean;
};

export function CategoryCard({
  categoria,
  label,
  items,
  total,
  mes,
  anio,
  currency,
  meta,
  pct,
  semaforo,
  metaLabel,
  extraLine,
}: {
  categoria: Categoria;
  label: string;
  items: Item[];
  total: number;
  mes: number;
  anio: number;
  currency: CurrencyConfig;
  meta?: number;
  pct?: number;
  semaforo?: Semaforo;
  metaLabel?: string;
  /** Fila de solo lectura calculada (p. ej. el aporte al Presupuesto Familiar). */
  extraLine?: { label: string; monto: number; href?: string };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy">
            {formatoMoneda(total, currency.primaria)}
          </span>
          {semaforo && <SemaforoBadge nivel={semaforo} />}
        </div>
      </CardHeader>
      <CardBody>
        {meta !== undefined && pct !== undefined && semaforo && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{formatoPct(pct)} del ingreso disponible</span>
              <span>{metaLabel ?? `Meta ${formatoPct(meta)}`}</span>
            </div>
            <ProgressBar value={pct} color={SEMAFORO_COLOR[semaforo]} />
          </div>
        )}

        <ul className="divide-y divide-border mb-3">
          {items.length === 0 && !extraLine && (
            <li className="text-sm text-gray-400 py-2">Sin movimientos este mes.</li>
          )}
          {extraLine && (
            <li className="flex items-center justify-between py-2 text-sm italic">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Users size={13} className="shrink-0" />
                {extraLine.href ? (
                  <Link href={extraLine.href} className="hover:underline">
                    {extraLine.label}
                  </Link>
                ) : (
                  extraLine.label
                )}
              </span>
              <span className="text-gray-500">
                {formatoMoneda(extraLine.monto, currency.primaria)}
              </span>
            </li>
          )}
          {items.map((item) => (
            <EditableBudgetRow
              key={item.id}
              item={item}
              currency={currency}
              updateAction={updateBudgetItem}
              deleteAction={deleteBudgetItem}
            />
          ))}
        </ul>

        <form action={addBudgetItem} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="categoria" value={categoria} />
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="anio" value={anio} />
          <input
            name="concepto"
            placeholder="Concepto"
            required
            className="flex-1 min-w-[8rem] rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
          <MontoConMoneda
            activas={currency.activas}
            primaria={currency.primaria}
            required
          />
          <label className="flex select-none items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
            <input
              type="checkbox"
              name="automatico"
              className="h-4 w-4 rounded border-border accent-green"
            />
            <Repeat size={13} />
            Automático
          </label>
          <button
            type="submit"
            className="shrink-0 bg-navy text-white rounded-lg p-2 hover:bg-navy-light"
            aria-label="Agregar"
          >
            <Plus size={16} />
          </button>
        </form>
      </CardBody>
    </Card>
  );
}
