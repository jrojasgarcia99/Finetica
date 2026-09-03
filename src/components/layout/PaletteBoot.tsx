"use client";

import { useEffect } from "react";
import { PALETTE_COOKIE, type Tema } from "@/lib/theme";

/**
 * Reconcilia el tema de color al abrir la app: la fuente de verdad es
 * `personal_spaces.tema` (prop `palette`). Si la cookie de vía rápida no existe
 * o quedó vieja (p. ej. primer inicio de sesión en otro dispositivo), la pone al
 * día para que el layout raíz pinte `data-palette` correcto de ahí en adelante.
 */
export function PaletteBoot({ palette }: { palette: Tema }) {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.palette !== palette) root.dataset.palette = palette;
    try {
      document.cookie = `${PALETTE_COOKIE}=${palette}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    } catch {
      /* cookies no disponibles */
    }
  }, [palette]);

  return null;
}
