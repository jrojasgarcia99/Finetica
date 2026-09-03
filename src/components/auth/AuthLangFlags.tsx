"use client";

import { useRouter } from "next/navigation";

const FLAGS = {
  es: (
    <svg viewBox="0 0 24 16" className="h-full w-full" aria-hidden="true">
      <rect width="24" height="16" fill="#c60b1e" />
      <rect y="4" width="24" height="8" fill="#ffc400" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 24 16" className="h-full w-full" aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
    </svg>
  ),
} as const;

const LABEL = { es: "Español", en: "English" } as const;

function persistLang(v: "es" | "en") {
  document.cookie = `finefica_lang=${v}; path=/; max-age=31536000; samesite=lax`;
}

export function AuthLangFlags({ current }: { current: "es" | "en" }) {
  const router = useRouter();

  function pick(v: "es" | "en") {
    if (v === current) return;
    persistLang(v);
    router.refresh();
  }

  return (
    <div className="absolute right-4 top-4 z-10 flex gap-1.5">
      {(["es", "en"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => pick(v)}
          aria-label={LABEL[v]}
          aria-pressed={v === current}
          className={`h-6 w-9 overflow-hidden rounded-md transition-all ${
            v === current
              ? "ring-2 ring-gold-light"
              : "opacity-55 ring-1 ring-white/25 hover:opacity-100"
          }`}
        >
          {FLAGS[v]}
        </button>
      ))}
    </div>
  );
}
