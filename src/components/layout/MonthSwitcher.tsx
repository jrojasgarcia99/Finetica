"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MESES_LABEL } from "@/lib/calculations";

export function MonthSwitcher({ mes, anio }: { mes: number; anio: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-2 py-1.5">
      <button onClick={prev} className="p-1.5 rounded hover:bg-gray-100 text-navy" aria-label="Mes anterior">
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-medium text-navy w-32 text-center">
        {MESES_LABEL[mes - 1]} {anio}
      </span>
      <button onClick={next} className="p-1.5 rounded hover:bg-gray-100 text-navy" aria-label="Mes siguiente">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
