"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";

/**
 * Ventana compartida: bottom sheet en móvil, modal centrado en escritorio.
 * Bloquea el scroll de fondo, cierra con Escape / tocando afuera / la X.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up motion-reduce:animate-none flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[var(--radius-card)] bg-card shadow-[var(--shadow-card)] pb-[env(safe-area-inset-bottom)] sm:rounded-[var(--radius-card)] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <p className="text-base font-semibold text-navy">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-navy"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
