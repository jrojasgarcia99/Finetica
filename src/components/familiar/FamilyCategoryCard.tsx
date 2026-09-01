import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatoMoneda } from "@/lib/calculations";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { EditableBudgetRow } from "@/components/presupuesto/EditableBudgetRow";
import type { CurrencyConfig } from "@/lib/currency";
import type { Moneda } from "@/lib/types";
import { Plus, Repeat, Trash2 } from "lucide-react";

type Item = {
  id: string;
  concepto: string;
  monto: number;
  moneda: Moneda;
  automatico: boolean;
};

export function FamilyCategoryCard({
  categoriaId,
  categoria,
  items,
  total,
  mes,
  anio,
  currency,
  addAction,
  updateAction,
  deleteAction,
  deleteCategoryAction,
}: {
  categoriaId: string;
  categoria: string;
  items: Item[];
  total: number;
  mes: number;
  anio: number;
  currency: CurrencyConfig;
  addAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{categoria}</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-navy">
            {formatoMoneda(total, currency.primaria)}
          </span>
          <form action={deleteCategoryAction}>
            <input type="hidden" name="id" value={categoriaId} />
            <input type="hidden" name="nombre" value={categoria} />
            <button
              type="submit"
              className="text-gray-300 transition-colors hover:text-red"
              aria-label={`Eliminar categoría ${categoria}`}
              title="Eliminar categoría (y sus gastos)"
            >
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      </CardHeader>
      <CardBody>
        <ul className="divide-y divide-border mb-3">
          {items.length === 0 && (
            <li className="text-sm text-gray-400 py-2">Sin movimientos este mes.</li>
          )}
          {items.map((item) => (
            <EditableBudgetRow
              key={item.id}
              item={item}
              currency={currency}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))}
        </ul>

        <form action={addAction} className="flex flex-wrap items-center gap-2">
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
