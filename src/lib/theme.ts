import { TEMAS, DEFAULT_TEMA, type Tema } from "@/lib/types";

export { TEMAS, DEFAULT_TEMA, type Tema };

/** Cookie de vía rápida (la fuente de verdad es `personal_spaces.tema`). */
export const PALETTE_COOKIE = "finefica_palette";

export function normalizeTema(value: unknown): Tema {
  return (TEMAS as readonly string[]).includes(value as string)
    ? (value as Tema)
    : DEFAULT_TEMA;
}

export const TEMA_LABEL_KEY: Record<Tema, string> = {
  clasico: "theme.clasico",
  rosa: "theme.rosa",
  lavanda: "theme.lavanda",
  menta: "theme.menta",
  cielo: "theme.cielo",
  arena: "theme.arena",
};

type Swatch = { bg: string; card: string; primary: string; accent: string };

/**
 * Colores reales de cada tema para pintar la vista previa del selector (sin
 * depender del CSS). Deben coincidir con `globals.css`.
 */
export const TEMA_SWATCH: Record<Tema, { light: Swatch; dark: Swatch }> = {
  clasico: {
    light: { bg: "#f9fafb", card: "#ffffff", primary: "#1f3864", accent: "#b8860b" },
    dark: { bg: "#0b1220", card: "#141d30", primary: "#2e5395", accent: "#d4af37" },
  },
  rosa: {
    light: { bg: "#fdf3f7", card: "#ffffff", primary: "#8a2f54", accent: "#9a5a3c" },
    dark: { bg: "#1b1016", card: "#271722", primary: "#a23c66", accent: "#e0a87a" },
  },
  lavanda: {
    light: { bg: "#f5f3fc", card: "#ffffff", primary: "#5a3aa6", accent: "#6d28d9" },
    dark: { bg: "#14111f", card: "#1e1930", primary: "#6d4ec0", accent: "#b494f0" },
  },
  menta: {
    light: { bg: "#eff6f1", card: "#ffffff", primary: "#1f5a3d", accent: "#2b6a4a" },
    dark: { bg: "#0f1a14", card: "#16241c", primary: "#2a7150", accent: "#5fbf8c" },
  },
  cielo: {
    light: { bg: "#eff5fb", card: "#ffffff", primary: "#1c4e8a", accent: "#1264a8" },
    dark: { bg: "#0c1420", card: "#13202f", primary: "#2a63a8", accent: "#5aa9e8" },
  },
  arena: {
    light: { bg: "#faf3ea", card: "#ffffff", primary: "#9a4a28", accent: "#8a6526" },
    dark: { bg: "#1a130d", card: "#241a12", primary: "#b0592f", accent: "#d9a066" },
  },
};
