"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

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

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* almacenamiento no disponible: el cambio dura solo esta sesión */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const dark = tone === "dark";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
        dark
          ? "text-white/70 hover:bg-white/10 hover:text-white"
          : "border border-border bg-white text-navy shadow-sm hover:bg-gray-50"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}
