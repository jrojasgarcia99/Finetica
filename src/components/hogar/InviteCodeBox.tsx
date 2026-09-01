"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InviteCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // portapapeles no disponible; el usuario puede copiarlo a mano
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-3 rounded-lg border border-dashed border-navy-light/40 bg-navy/5 px-4 py-3 hover:bg-navy/10 transition-colors"
    >
      <span className="text-2xl font-mono font-semibold tracking-[0.3em] text-navy">
        {code}
      </span>
      {copied ? <Check size={18} className="text-green" /> : <Copy size={18} className="text-navy-light" />}
    </button>
  );
}
