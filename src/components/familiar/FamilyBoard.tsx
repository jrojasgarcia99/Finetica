"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, RefreshCw, Zap, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatoMoneda } from "@/lib/calculations";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { EditableBudgetRow, type BudgetRowItem } from "@/components/presupuesto/EditableBudgetRow";
import { useT } from "@/components/i18n/I18nProvider";
import type { CurrencyConfig } from "@/lib/currency";

export type FamilySection = {
  key: string; // nombre real de la categoría (clave de datos)
  label: string; // etiqueta traducida para mostrar
  categoriaId: string;
  total: number;
  items: BudgetRowItem[];
};

type Lists = Record<string, BudgetRowItem[]>;
const build = (s: FamilySection[]): Lists =>
  Object.fromEntries(s.map((x) => [x.key, x.items]));
const sig = (s: FamilySection[]): string =>
  s.map((x) => x.key + ":" + x.items.map((i) => i.id).join(",")).join("|");

export function FamilyBoard({
  sections,
  currency,
  mes,
  anio,
  addAction,
  updateAction,
  deleteAction,
  deleteCategoryAction,
  applyOrder,
}: {
  sections: FamilySection[];
  currency: CurrencyConfig;
  mes: number;
  anio: number;
  addAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction: (formData: FormData) => void | Promise<void>;
  applyOrder: (payload: {
    mes: number;
    anio: number;
    listas: Record<string, string[]>;
  }) => void | Promise<void>;
}) {
  const t = useT();
  const [, startTransition] = useTransition();
  const [lists, setLists] = useState<Lists>(() => build(sections));
  const [activeId, setActiveId] = useState<string | null>(null);

  const serverSig = sig(sections);
  const [s, setS] = useState(serverSig);
  if (s !== serverSig) {
    setS(serverSig);
    setLists(build(sections));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const containerOf = (id: string): string | null => {
    if (id in lists) return id;
    return Object.keys(lists).find((c) => lists[c].some((i) => i.id === id)) ?? null;
  };

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    if (!from || !to || from === to) return;
    setLists((prev) => {
      const moving = prev[from].find((i) => i.id === active.id);
      if (!moving) return prev;
      const overIdx = prev[to].findIndex((i) => i.id === over.id);
      const at = overIdx >= 0 ? overIdx : prev[to].length;
      return {
        ...prev,
        [from]: prev[from].filter((i) => i.id !== active.id),
        [to]: [...prev[to].slice(0, at), moving, ...prev[to].slice(at)],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (over) {
      const cont = containerOf(String(over.id)) ?? containerOf(String(active.id));
      if (cont) {
        setLists((prev) => {
          const arr = prev[cont];
          const oi = arr.findIndex((i) => i.id === active.id);
          const ni = over.id in prev ? arr.length - 1 : arr.findIndex((i) => i.id === over.id);
          if (oi === -1 || ni === -1 || oi === ni) return prev;
          return { ...prev, [cont]: arrayMove(arr, oi, ni) };
        });
      }
    }
    setLists((current) => {
      const listas = Object.fromEntries(
        Object.entries(current).map(([c, arr]) => [c, arr.map((i) => i.id)]),
      );
      startTransition(() => applyOrder({ mes, anio, listas }));
      return current;
    });
  }

  const activeItem = activeId
    ? Object.values(lists).flat().find((i) => i.id === activeId) ?? null
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((sec) => {
          const items = lists[sec.key] ?? [];
          return (
            <Card key={sec.categoriaId}>
              <CardHeader>
                <CardTitle>{sec.label}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-navy">
                    {formatoMoneda(sec.total, currency.primaria)}
                  </span>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={sec.categoriaId} />
                    <input type="hidden" name="nombre" value={sec.key} />
                    <button
                      type="submit"
                      className="text-gray-300 transition-colors hover:text-red"
                      aria-label={t("familiar.deleteCategory", { name: sec.label })}
                      title={t("familiar.deleteCategoryTitle")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </CardHeader>
              <CardBody>
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-border mb-3 min-h-[8px]">
                    {items.length === 0 && (
                      <li className="text-sm text-gray-400 py-2">{t("cat.noMovements")}</li>
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
                </SortableContext>

                <form action={addAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="categoria" value={sec.key} />
                  <input type="hidden" name="mes" value={mes} />
                  <input type="hidden" name="anio" value={anio} />
                  <input
                    name="concepto"
                    placeholder={t("common.concepto")}
                    required
                    className="flex-1 min-w-[8rem] rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
                  />
                  <MontoConMoneda
                    activas={currency.activas}
                    primaria={currency.primaria}
                    required
                  />
                  <label className="flex select-none items-center gap-1 whitespace-nowrap text-xs text-gray-500">
                    <input
                      type="checkbox"
                      name="recurrente"
                      className="h-4 w-4 rounded border-border accent-green"
                    />
                    <RefreshCw size={13} />
                    {t("cat.recurring")}
                  </label>
                  <label className="flex select-none items-center gap-1 whitespace-nowrap text-xs text-gray-500">
                    <input
                      type="checkbox"
                      name="automatico"
                      className="h-4 w-4 rounded border-border accent-navy"
                    />
                    <Zap size={13} />
                    {t("cat.automatic")}
                  </label>
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
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rounded-lg border border-navy-light bg-card px-3 py-2 text-sm shadow-lg">
            {activeItem.concepto}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
