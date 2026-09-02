"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CardTitle } from "@/components/ui/Card";
import { SemaforoBadge } from "@/components/ui/Semaforo";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import type { CategoriaTipo, Semaforo } from "@/lib/types";

export function CategoryHeader({
  id,
  clave,
  nombre,
  tipo,
  metaPct,
  totalLabel,
  semaforo,
  updateAction,
  deleteAction,
}: {
  id: string;
  clave: string;
  nombre: string;
  tipo: CategoriaTipo;
  metaPct: number; // ya en % (0-100)
  totalLabel: string;
  semaforo?: Semaforo;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="w-full">
        <form
          action={async (fd) => {
            await updateAction(fd);
            setEditing(false);
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={id} />
          <Input name="nombre" defaultValue={nombre} required aria-label={t("cat.name")} />
          <Select name="tipo" defaultValue={tipo} aria-label={t("cat.type")}>
            <option value="maximo">{t("cat.tipoMax")}</option>
            <option value="minimo">{t("cat.tipoMin")}</option>
          </Select>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              name="meta"
              defaultValue={Number(metaPct.toFixed(2))}
              className="pr-8"
              aria-label={t("cat.goal")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {t("common.save")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm(t("cat.deleteCategoryConfirm"))) e.preventDefault();
          }}
          className="mt-2"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="clave" value={clave} />
          <button type="submit" className="inline-flex items-center gap-1 text-xs text-red hover:underline">
            <Trash2 size={12} />
            {t("cat.deleteCategory")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <CardTitle className="flex items-center gap-1.5">
        {nombre}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-gray-300 transition-colors hover:text-navy"
          aria-label={t("cat.editCategory")}
        >
          <Pencil size={13} />
        </button>
      </CardTitle>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">{totalLabel}</span>
        {semaforo && <SemaforoBadge nivel={semaforo} />}
      </div>
    </>
  );
}
