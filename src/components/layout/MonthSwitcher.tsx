"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mesesLabel } from "@/lib/i18n";
import { useT, useLocale } from "@/components/i18n/I18nProvider";

export function MonthSwitcher({ mes, anio }: { mes: number; anio: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useT();
  const locale = useLocale();
  const MESES = mesesLabel(locale);

  function go(newMes: number, newAnio: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", String(newMes));
    params.set("anio", String(newAnio));
    router.push(`${pathname}?${params.toString()}`);
  }

  function prev() {
    if (mes === 1) go(12, anio - 1);
    else go(mes - 1, anio);
  }
  function next() {
    if (mes === 12) go(1, anio + 1);
    else go(mes + 1, anio);
  }

  return (
    <div className="flex w-full items-center gap-1 rounded-full bg-gray-100 p-1 sm:inline-flex sm:w-auto">
      <button
        onClick={prev}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-navy transition-colors hover:bg-white"
        aria-label={t("month.prev")}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="flex-1 rounded-full bg-white px-2 py-2 text-center text-sm font-medium text-navy shadow-[var(--shadow-soft)] sm:w-36 sm:flex-none">
        {MESES[mes - 1]} {anio}
      </span>
      <button
        onClick={next}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-navy transition-colors hover:bg-white"
        aria-label={t("month.next")}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
