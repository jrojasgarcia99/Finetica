"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useT } from "@/components/i18n/I18nProvider";
import type { CategoriaTipo } from "@/lib/types";

/** Ventana para editar (o eliminar) una categoría del presupuesto personal. */
export function CategoryDialog({
  open,
  onClose,
  id,
  clave,
  nombre,
  tipo,
  metaPct,
  updateAction,
  deleteAction,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  clave: string;
  nombre: string;
  tipo: CategoriaTipo;
  metaPct: number;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title={t("cat.editCategory")}>
      <form
        action={async (fd) => {
          await updateAction(fd);
          onClose();
        }}
        className="space-y-4 p-5"
      >
        <input type="hidden" name="id" value={id} />

        <Field label={t("cat.name")}>
          <Input name="nombre" defaultValue={nombre} required />
        </Field>

        <Field label={t("cat.type")}>
          <Select name="tipo" defaultValue={tipo}>
            <option value="maximo">{t("cat.tipoMax")}</option>
            <option value="minimo">{t("cat.tipoMin")}</option>
          </Select>
        </Field>

        <Field label={t("cat.goal")}>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              name="meta"
              defaultValue={Number(metaPct.toFixed(2))}
              className="pr-8"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              %
            </span>
          </div>
        </Field>

        <Button type="submit" className="w-full">
          {t("common.save")}
        </Button>
      </form>

      <div className="border-t border-border p-5 pt-4">
        <button
          type="button"
          onClick={() => setConfirmDel(true)}
          className="w-full rounded-full border border-red/30 py-2.5 text-[15px] font-medium text-red transition-colors hover:bg-red/5"
        >
          {t("cat.deleteCategory")}
        </button>
        <ConfirmDialog
          open={confirmDel}
          title={t("cat.deleteCategory")}
          message={t("cat.deleteCategoryConfirm")}
          onCancel={() => setConfirmDel(false)}
          onConfirm={async () => {
            const fd = new FormData();
            fd.set("id", id);
            fd.set("clave", clave);
            await deleteAction(fd);
            setConfirmDel(false);
            onClose();
          }}
        />
      </div>
    </Sheet>
  );
}
