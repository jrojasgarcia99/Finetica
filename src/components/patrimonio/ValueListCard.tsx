import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatoColones } from "@/lib/calculations";
import { Trash2, Plus } from "lucide-react";

type Item = { id: string; concepto: string; valor: number };

export function ValueListCard({
  title,
  items,
  total,
  totalColor,
  addAction,
  deleteAction,
}: {
  title: string;
  items: Item[];
  total: number;
  totalColor: "green" | "red";
  addAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className={`text-sm font-semibold ${totalColor === "green" ? "text-green" : "text-red"}`}>
          {formatoColones(total)}
        </span>
      </CardHeader>
      <CardBody>
        <ul className="divide-y divide-border mb-3">
          {items.length === 0 && (
            <li className="text-sm text-gray-400 py-2">Sin registros todavía.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-700">{item.concepto}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">{formatoColones(item.valor)}</span>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="text-gray-300 hover:text-red" aria-label="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <form action={addAction} className="flex items-center gap-2">
          <input
            name="concepto"
            placeholder="Concepto"
            required
            className="flex-1 min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
          <input
            name="valor"
            type="number"
            step="0.01"
            placeholder="Valor"
            required
            className="w-32 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
          <button type="submit" className="shrink-0 bg-navy text-white rounded-lg p-2 hover:bg-navy-light" aria-label="Agregar">
            <Plus size={16} />
          </button>
        </form>
      </CardBody>
    </Card>
  );
}
