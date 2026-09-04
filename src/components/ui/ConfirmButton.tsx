"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Botón que ejecuta una Server Action sólo después de confirmar en un modal de
 * la app (nada de `window.confirm`). Los `fields` se mandan como FormData.
 */
export function ConfirmButton({
  action,
  fields = {},
  children,
  className,
  title,
  message,
  confirmLabel,
  danger = true,
  onDone,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    startTransition(async () => {
      await action(fd);
      setOpen(false);
      onDone?.();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        disabled={pending}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        danger={danger}
        pending={pending}
        onConfirm={run}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
