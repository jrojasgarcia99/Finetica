"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { CardTitle } from "@/components/ui/Card";
import { SemaforoBadge } from "@/components/ui/Semaforo";
import { CategoryDialog } from "./CategoryDialog";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <CardTitle className="flex items-center gap-1.5">
        {nombre}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-gray-300 transition-colors hover:text-navy"
          aria-label={t("cat.editCategory")}
        >
          <Pencil size={15} />
        </button>
      </CardTitle>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">{totalLabel}</span>
        {semaforo && <SemaforoBadge nivel={semaforo} />}
      </div>

      <CategoryDialog
        open={open}
        onClose={() => setOpen(false)}
        id={id}
        clave={clave}
        nombre={nombre}
        tipo={tipo}
        metaPct={metaPct}
        updateAction={updateAction}
        deleteAction={deleteAction}
      />
    </>
  );
}
