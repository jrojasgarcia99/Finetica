"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";

/**
 * Confirmación dentro de la app (reemplaza `window.confirm`). Controlado por
 * `open`; `onConfirm` dispara la acción real.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = true,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="animate-sheet-up motion-reduce:animate-none w-full max-w-sm rounded-[var(--radius-card)] bg-card p-5 shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-navy">{title}</p>
        {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={pending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel ?? t("common.delete")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
