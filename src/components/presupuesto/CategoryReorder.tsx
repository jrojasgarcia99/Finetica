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
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowUpDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { useT } from "@/components/i18n/I18nProvider";

type Item = { id: string; label: string };

function ReorderRow({ id, label }: Item) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
      }}
      className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label={t("cat.dragHandle")}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <span className="text-navy">{label}</span>
    </li>
  );
}

export function CategoryReorder({
  items,
  action,
}: {
  items: Item[];
  action: (orderedIds: string[]) => Promise<{ ok: boolean } | void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Item[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sig = items.map((i) => `${i.id}:${i.label}`).join("|");
  const [seenSig, setSeenSig] = useState(sig);
  if (sig !== seenSig && !activeId && !isPending) {
    setSeenSig(sig);
    setOrder(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (items.length < 2) return null;

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = order.findIndex((i) => i.id === active.id);
    const newI = order.findIndex((i) => i.id === over.id);
    if (oldI < 0 || newI < 0) return;
    const next = arrayMove(order, oldI, newI);
    setOrder(next);
    startTransition(async () => {
      try {
        await action(next.map((i) => i.id));
      } catch {
        /* el próximo refresco vuelve al estado del servidor */
      }
    });
  }

  const activeItem = order.find((i) => i.id === activeId) ?? null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-light hover:underline"
      >
        <ArrowUpDown size={14} />
        {t("cat.reorder")}
      </button>

      {open && (
        <Card className="mt-2">
          <CardBody>
            <p className="mb-3 text-xs text-gray-500">{t("cat.reorderHint")}</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext
                items={order.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {order.map((i) => (
                    <ReorderRow key={i.id} id={i.id} label={i.label} />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                {activeItem ? (
                  <div className="rounded-lg border border-navy-light bg-card px-3 py-2.5 text-sm text-navy shadow-lg">
                    {activeItem.label}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
