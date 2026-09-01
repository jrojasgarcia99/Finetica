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
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, RefreshCw, CalendarClock, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatoMoneda } from "@/lib/calculations";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { EditableBudgetRow, type BudgetRowItem } from "@/components/presupuesto/EditableBudgetRow";
import { Tooltip } from "@/components/ui/Tooltip";
import { useT } from "@/components/i18n/I18nProvider";
import type { CurrencyConfig } from "@/lib/currency";

export type FamilySection = {
  key: string;
  label: string;
  categoriaId: string;
  total: number;
  items: BudgetRowItem[];
};

type Lists = Record<string, BudgetRowItem[]>;
const buildLists = (s: FamilySection[]): Lists =>
  Object.fromEntries(s.map((x) => [x.key, x.items]));
const rowSig = (i: BudgetRowItem): string =>
  `${i.id}:${i.concepto}:${i.monto}:${i.moneda}:${i.automatico ? 1 : 0}:${i.recurrente ? 1 : 0}`;
const signature = (s: FamilySection[]): string =>
  s.map((x) => x.key + ":" + x.items.map(rowSig).join(",")).join("|");
const listsSignature = (l: Lists): string =>
  Object.entries(l).map(([k, arr]) => k + ":" + arr.map(rowSig).join(",")).join("|");

function DroppableList({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <ul
      ref={setNodeRef}
      className={`divide-y divide-border mb-3 min-h-[2.25rem] rounded transition-colors ${
        isOver ? "bg-navy-light/5" : ""
      }`}
    >
      {children}
    </ul>
  );
}

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
  }) => Promise<{ ok: boolean } | void>;
}) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [lists, setLists] = useState<Lists>(() => buildLists(sections));
  const [activeId, setActiveId] = useState<string | null>(null);

  const serverSig = signature(sections);
  const [sig, setSig] = useState(serverSig);
  if (sig !== serverSig && !activeId && !isPending) {
    setSig(serverSig);
    setLists(buildLists(sections));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const containerOf = (id: string): string | null => {
    if (id in lists) return id;
    return Object.keys(lists).find((c) => lists[c].some((i) => i.id === id)) ?? null;
  };

  function persist(next: Lists) {
    if (listsSignature(next) === serverSig) return;
    const listas = Object.fromEntries(
      Object.entries(next).map(([c, arr]) => [c, arr.map((i) => i.id)]),
    );
    startTransition(async () => {
      try {
        await applyOrder({ mes, anio, listas });
      } catch {
        /* el próximo refresco vuelve al estado del servidor */
      }
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    if (!from || !to) return;

    let next: Lists;
    if (from === to) {
      const arr = lists[from];
      const oldI = arr.findIndex((i) => i.id === active.id);
      const newI =
        String(over.id) in lists ? arr.length - 1 : arr.findIndex((i) => i.id === over.id);
      if (oldI < 0 || newI < 0 || oldI === newI) return;
      next = { ...lists, [from]: arrayMove(arr, oldI, newI) };
    } else {
      const moving = lists[from].find((i) => i.id === active.id);
      if (!moving) return;
      const toArr = lists[to];
      const overIdx =
        String(over.id) in lists ? toArr.length : toArr.findIndex((i) => i.id === over.id);
      const insertAt = overIdx < 0 ? toArr.length : overIdx;
      next = {
        ...lists,
        [from]: lists[from].filter((i) => i.id !== active.id),
        [to]: [...toArr.slice(0, insertAt), moving, ...toArr.slice(insertAt)],
      };
    }
    setLists(next);
    persist(next);
  }

  const activeItem = activeId
    ? Object.values(lists).flat().find((i) => i.id === activeId) ?? null
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
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
                    <Tooltip content={t("tip.deleteCategory")}>
                      <button
                        type="submit"
                        className="text-gray-300 transition-colors hover:text-red"
                        aria-label={t("familiar.deleteCategory", { name: sec.label })}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </form>
                </div>
              </CardHeader>
              <CardBody>
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableList id={sec.key}>
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
                  </DroppableList>
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
                  <label
                    title={t("cat.recurringTitle")}
                    className="flex h-9 cursor-pointer select-none items-center rounded-lg border border-border px-2 text-gray-400 has-[:checked]:border-green has-[:checked]:text-green"
                  >
                    <input type="checkbox" name="recurrente" className="sr-only" />
                    <RefreshCw size={15} />
                  </label>
                  <label
                    title={t("cat.automaticTitle")}
                    className="flex h-9 cursor-pointer select-none items-center rounded-lg border border-border px-2 text-gray-400 has-[:checked]:border-gold has-[:checked]:text-gold"
                  >
                    <input type="checkbox" name="automatico" className="sr-only" />
                    <CalendarClock size={15} />
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
          <div className="rounded-lg border border-navy-light bg-card px-3 py-2 text-sm text-navy shadow-lg">
            {activeItem.concepto}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
