"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";

export function InviteCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* portapapeles no disponible */
    }
  }

  return (
    <button
      onClick={copy}
      aria-label={copied ? t("invite.copied") : t("invite.copy")}
      className="flex items-center gap-3 rounded-lg border border-dashed border-navy-light/40 bg-navy/5 px-4 py-3 hover:bg-navy/10 transition-colors"
    >
      <span className="text-2xl font-mono font-semibold tracking-[0.3em] text-navy">{code}</span>
      {copied ? <Check size={18} className="text-green" /> : <Copy size={18} className="text-navy-light" />}
    </button>
  );
}
