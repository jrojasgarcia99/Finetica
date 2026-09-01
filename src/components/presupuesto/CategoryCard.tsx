import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SemaforoBadge, ProgressBar } from "@/components/ui/Semaforo";
import { SEMAFORO_COLOR, type Categoria, type Semaforo } from "@/lib/types";
import { formatoColones, formatoPct } from "@/lib/calculations";
import { addBudgetItem, deleteBudgetItem } from "@/app/(app)/presupuesto/actions";
import { Trash2, Plus } from "lucide-react";

type Item = { id: string; concepto: string; monto: number };

export function CategoryCard({
  categoria,
  label,
  items,
  total,
  mes,
  anio,
  meta,
  pct,
  semaforo,
  metaLabel,
}: {
  categoria: Categoria;
  label: string;
  items: Item[];
  total: number;
  mes: number;
  anio: number;
  meta?: number;
  pct?: number;
  semaforo?: Semaforo;
  metaLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy">{formatoColones(total)}</span>
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
          {items.length === 0 && (
            <li className="text-sm text-gray-400 py-2">Sin movimientos este mes.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-700">{item.concepto}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">{formatoColones(item.monto)}</span>
                <form action={deleteBudgetItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-gray-300 hover:text-red transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <form action={addBudgetItem} className="flex items-center gap-2">
          <input type="hidden" name="categoria" value={categoria} />
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="anio" value={anio} />
          <input
            name="concepto"
            placeholder="Concepto"
            required
            className="flex-1 min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
          <input
            name="monto"
            type="number"
            step="0.01"
            placeholder="Monto"
            required
            className="w-28 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
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
