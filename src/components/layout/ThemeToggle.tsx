"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { Tooltip } from "@/components/ui/Tooltip";
import { THEME_MODE_COOKIE } from "@/lib/theme";

type Theme = "light" | "dark";

const THEME_EVENT = "finefica:themechange";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}
function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = useT();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* almacenamiento no disponible */
    }
    try {
      // El servidor también lo necesita (root layout), así el <html> sale con
      // el data-theme correcto desde el primer byte en cada navegación.
      document.cookie = `${THEME_MODE_COOKIE}=${next}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    } catch {
      /* cookies no disponibles */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const dark = tone === "dark";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <Tooltip content={t("tip.tema")} side="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          dark
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "border border-border bg-white text-navy shadow-sm hover:bg-gray-50"
        }`}
      >
        <Icon size={16} />
      </button>
    </Tooltip>
  );
}
