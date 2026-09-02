"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";

export function AddCategoryForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="mt-6">
      <CardBody>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-medium text-navy-light hover:underline"
          >
            <Plus size={15} />
            {t("cat.newCategory")}
          </button>
        ) : (
          <form
            ref={formRef}
            action={async (fd) => {
              await action(fd);
              formRef.current?.reset();
              setOpen(false);
            }}
            className="grid gap-3 sm:grid-cols-4"
          >
            <Field label={t("cat.name")}>
              <Input name="nombre" required autoFocus />
            </Field>
            <Field label={t("cat.type")}>
              <Select name="tipo" defaultValue="maximo">
                <option value="maximo">{t("cat.tipoMax")}</option>
                <option value="minimo">{t("cat.tipoMin")}</option>
              </Select>
            </Field>
            <Field label={t("cat.goalPct")}>
              <div className="relative">
                <Input type="number" step="0.1" min="0" name="meta" defaultValue="0" className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1">
                {t("common.add")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} aria-label={t("common.cancel")}>
                <X size={16} />
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
