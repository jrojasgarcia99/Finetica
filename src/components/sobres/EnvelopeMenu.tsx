"use client";

import { useState } from "react";
import { MoreVertical, Pencil } from "lucide-react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { useT } from "@/components/i18n/I18nProvider";
import { EnvelopeEditDialog } from "./EnvelopeEditDialog";
import type { Envelope } from "@/lib/types";

export function EnvelopeMenu({
  envelope,
  resetAction,
  updateAction,
  deleteAction,
}: {
  envelope: Envelope;
  resetAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.more")}
        className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-navy"
      >
        <MoreVertical size={22} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEditing(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-navy hover:bg-gray-50"
            >
              <Pencil size={14} />
              {t("sobres.editEnvelope")}
            </button>
            <form action={resetAction}>
              <input type="hidden" name="id" value={envelope.id} />
              <button
                type="submit"
                className="block w-full px-4 py-3 text-left text-sm text-navy hover:bg-gray-50"
              >
                {t("sobres.resetNow")}
              </button>
            </form>
            <ConfirmButton
              action={deleteAction}
              fields={{ id: envelope.id }}
              title={t("common.delete")}
              message={t("sobres.deleteConfirm")}
              onDone={() => setOpen(false)}
              className="block w-full px-4 py-3 text-left text-sm text-red hover:bg-red/5"
            >
              {t("common.delete")}
            </ConfirmButton>
          </div>
        </>
      )}

      <EnvelopeEditDialog
        open={editing}
        onClose={() => setEditing(false)}
        envelope={envelope}
        action={updateAction}
      />
    </div>
  );
}
