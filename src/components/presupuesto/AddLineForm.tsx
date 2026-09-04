"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { BudgetRowDialog } from "./BudgetRowDialog";
import type { CurrencyConfig } from "@/lib/currency";

export function AddLineForm({
  categoria,
  mes,
  anio,
  currency,
  addAction,
}: {
  categoria: string;
  mes: number;
  anio: number;
  currency: CurrencyConfig;
  addAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm text-gray-400 transition-colors hover:border-navy-light hover:text-navy"
      >
        <Plus size={16} />
        {t("cat.addLine")}
      </button>

      <BudgetRowDialog
        open={open}
        onClose={() => setOpen(false)}
        currency={currency}
        action={addAction}
        categoria={categoria}
        mes={mes}
        anio={anio}
      />
    </>
  );
}
