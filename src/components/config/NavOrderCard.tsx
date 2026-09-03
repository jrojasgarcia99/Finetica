"use client";

import { Fragment, useState, useTransition } from "react";
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
import { GripVertical, Home } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/components/i18n/I18nProvider";
import { MOBILE_NAV_COUNT } from "@/components/layout/nav-items";
import type { TKey } from "@/lib/i18n";

type NavRow = { href: string; labelKey: string };

function Row({ href, labelKey, isHome }: NavRow & { isHome: boolean }) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: href,
  });
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
      <span className="text-navy">{t(labelKey as TKey)}</span>
      {isHome && (
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-400">
          <Home size={12} />
          {t("config.navOrderHome")}
        </span>
      )}
    </li>
  );
}

export function NavOrderCard({
  items,
  action,
}: {
  items: NavRow[];
  action: (orderedHrefs: string[]) => Promise<{ ok: boolean } | void>;
}) {
  const t = useT();
  const [order, setOrder] = useState<NavRow[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sig = items.map((i) => i.href).join("|");
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

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = order.findIndex((i) => i.href === active.id);
    const newI = order.findIndex((i) => i.href === over.id);
    if (oldI < 0 || newI < 0) return;
    const next = arrayMove(order, oldI, newI);
    setOrder(next);
    startTransition(async () => {
      try {
        await action(next.map((i) => i.href));
      } catch {
        /* el próximo refresco vuelve al estado del servidor */
      }
    });
  }

  const activeItem = order.find((i) => i.href === activeId) ?? null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.navOrder")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-3 text-xs text-gray-500">{t("config.navOrderDesc")}</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={order.map((i) => i.href)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {order.map((i, idx) => (
                <Fragment key={i.href}>
                  <Row {...i} isHome={idx === 0} />
                  {idx === MOBILE_NAV_COUNT - 1 && (
                    <li
                      aria-hidden
                      className="flex items-center gap-2 px-1 pt-1 text-[11px] font-medium text-gray-400"
                    >
                      <span className="h-px w-4 shrink-0 bg-border" />
                      <span className="text-center">{t("config.navOrderMobileDivider")}</span>
                      <span className="h-px flex-1 bg-border" />
                    </li>
                  )}
                </Fragment>
              ))}
            </ul>
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="rounded-lg border border-navy-light bg-card px-3 py-2.5 text-sm text-navy shadow-lg">
                {t(activeItem.labelKey as TKey)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardBody>
    </Card>
  );
}
