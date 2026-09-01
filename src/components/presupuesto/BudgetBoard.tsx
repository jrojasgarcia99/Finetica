"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { Plus, RefreshCw, Zap } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SemaforoBadge, ProgressBar } from "@/components/ui/Semaforo";
import { SEMAFORO_COLOR, type Semaforo } from "@/lib/types";
import { formatoMoneda, formatoPct } from "@/lib/calculations";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { EditableBudgetRow, type BudgetRowItem } from "@/components/presupuesto/EditableBudgetRow";
import { useT } from "@/components/i18n/I18nProvider";
import type { CurrencyConfig } from "@/lib/currency";

export type BudgetSection = {
  categoria: string;
  label: string;
  total: number;
  meta?: number;
  pct?: number;
  semaforo?: Semaforo;
  metaTipo?: "max" | "min";
  extraLine?: { label: string; monto: number; href?: string };
  items: BudgetRowItem[];
};

type Lists = Record<string, BudgetRowItem[]>;

function buildLists(sections: BudgetSection[]): Lists {
  return Object.fromEntries(sections.map((s) => [s.categoria, s.items]));
}
function signature(sections: BudgetSection[]): string {
  return sections
    .map((s) => s.categoria + ":" + s.items.map((i) => i.id).join(","))
    .join("|");
}

export function BudgetBoard({
  sections,
  currency,
  mes,
  anio,
  addAction,
  updateAction,
  deleteAction,
  applyOrder,
}: {
  sections: BudgetSection[];
  currency: CurrencyConfig;
  mes: number;
  anio: number;
  addAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  applyOrder: (payload: {
    mes: number;
    anio: number;
    listas: Record<string, string[]>;
  }) => void | Promise<void>;
}) {
  const t = useT();
  const [, startTransition] = useTransition();
  const [lists, setLists] = useState<Lists>(() => buildLists(sections));
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sincroniza con el servidor cuando cambian los datos (patrón "ajustar estado
  // al cambiar props" — setState en render, no en effecto).
  const serverSig = signature(sections);
  const [sig, setSig] = useState(serverSig);
  if (sig !== serverSig) {
    setSig(serverSig);
    setLists(buildLists(sections));
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

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    if (!from || !to || from === to) return;

    setLists((prev) => {
      const fromArr = prev[from];
      const toArr = prev[to];
      const moving = fromArr.find((i) => i.id === active.id);
      if (!moving) return prev;
      const overIndex = toArr.findIndex((i) => i.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : toArr.length;
      return {
        ...prev,
        [from]: fromArr.filter((i) => i.id !== active.id),
        [to]: [...toArr.slice(0, insertAt), moving, ...toArr.slice(insertAt)],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (over) {
      const cont = containerOf(String(over.id)) ?? containerOf(String(active.id));
      if (cont) {
        setLists((prev) => {
          const arr = prev[cont];
          const oldIndex = arr.findIndex((i) => i.id === active.id);
          const newIndex =
            over.id in prev ? arr.length - 1 : arr.findIndex((i) => i.id === over.id);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
          return { ...prev, [cont]: arrayMove(arr, oldIndex, newIndex) };
        });
      }
    }
    // Persistir el estado completo del tablero.
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
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((s) => {
          const items = lists[s.categoria] ?? [];
          const metaLabel =
            s.meta === undefined
              ? undefined
              : s.metaTipo === "max"
                ? t("cat.metaMax", { pct: formatoPct(s.meta) })
                : s.metaTipo === "min"
                  ? t("cat.metaMin", { pct: formatoPct(s.meta) })
                  : t("cat.meta", { pct: formatoPct(s.meta) });
          return (
            <Card key={s.categoria}>
              <CardHeader>
                <CardTitle>{s.label}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">
                    {formatoMoneda(s.total, currency.primaria)}
                  </span>
                  {s.semaforo && <SemaforoBadge nivel={s.semaforo} />}
                </div>
              </CardHeader>
              <CardBody>
                {s.meta !== undefined && s.pct !== undefined && s.semaforo && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t("cat.ofDisposable", { pct: formatoPct(s.pct) })}</span>
                      <span>{metaLabel}</span>
                    </div>
                    <ProgressBar value={s.pct} color={SEMAFORO_COLOR[s.semaforo]} />
                  </div>
                )}

                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-border mb-3 min-h-[8px]">
                    {items.length === 0 && !s.extraLine && (
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
                    {s.extraLine && (
                      <li className="flex items-center justify-between py-2 text-sm italic">
                        <span className="text-gray-500">
                          {s.extraLine.href ? (
                            <Link href={s.extraLine.href} className="hover:underline">
                              {s.extraLine.label}
                            </Link>
                          ) : (
                            s.extraLine.label
                          )}
                        </span>
                        <span className="text-gray-500">
                          {formatoMoneda(s.extraLine.monto, currency.primaria)}
                        </span>
                      </li>
                    )}
                  </ul>
                </SortableContext>

                <form action={addAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="categoria" value={s.categoria} />
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
