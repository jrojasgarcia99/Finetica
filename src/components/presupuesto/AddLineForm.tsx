"use client";

import { useRef, useState } from "react";
import { Plus, Repeat, CalendarClock, X } from "lucide-react";
import { MontoConMoneda } from "@/components/ui/MontoConMoneda";
import { useT } from "@/components/i18n/I18nProvider";
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
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm text-gray-400 transition-colors hover:border-navy-light hover:text-navy"
      >
        <Plus size={15} />
        {t("cat.addLine")}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await addAction(fd);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="categoria" value={categoria} />
      <input type="hidden" name="mes" value={mes} />
      <input type="hidden" name="anio" value={anio} />
      <input
        name="concepto"
        placeholder={t("common.concepto")}
        required
        autoFocus
        className="flex-1 min-w-[8rem] rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light/40"
      />
      <MontoConMoneda activas={currency.activas} primaria={currency.primaria} required />
      <label
        title={t("cat.recurringTitle")}
        className="flex h-9 cursor-pointer select-none items-center rounded-xl border border-border px-2 text-gray-400 has-[:checked]:border-navy has-[:checked]:text-navy"
      >
        <input type="checkbox" name="recurrente" className="sr-only" />
        <Repeat size={15} />
      </label>
      <label
        title={t("cat.automaticTitle")}
        className="flex h-9 cursor-pointer select-none items-center rounded-xl border border-border px-2 text-gray-400 has-[:checked]:border-gold has-[:checked]:text-gold"
      >
        <input type="checkbox" name="automatico" className="sr-only" />
        <CalendarClock size={15} />
      </label>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-navy p-2 text-white hover:bg-navy-light"
        aria-label={t("common.add")}
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="shrink-0 rounded-full border border-border p-2 text-gray-500 hover:bg-gray-50"
        aria-label={t("common.cancel")}
      >
        <X size={16} />
      </button>
    </form>
  );
}
