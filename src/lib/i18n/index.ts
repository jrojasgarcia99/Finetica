import type { Locale } from "@/lib/types";
import { es } from "./es";
import { en } from "./en";

export type { Locale };
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALES: Locale[] = ["es", "en"];

export type TKey = keyof typeof es;
export type Dict = Record<TKey, string>;
// Acepta claves conocidas (con autocompletado) y también strings construidos
// dinámicamente (`categoria.${cat}`); si la clave no existe, se devuelve tal cual.
export type TFn = (
  key: TKey | (string & {}),
  vars?: Record<string, string | number>,
) => string;

const DICTS: Record<Locale, Dict> = { es, en };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? es;
}

export function normalizeLocale(value: unknown): Locale {
  return value === "en" ? "en" : "es";
}

/** Traductor para componentes de servidor. Interpola `{var}`. */
export function tFor(locale: Locale): TFn {
  const dict = getDict(locale);
  return (key, vars) => {
    const k = key as TKey;
    let out: string = dict[k] ?? es[k] ?? String(key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return out;
  };
}

const MESES: Record<Locale, string[]> = {
  es: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

export function mesesLabel(locale: Locale): string[] {
  return MESES[locale] ?? MESES.es;
}

/** Traduce el nombre de una categoría por defecto del Presupuesto Familiar. */
const FAMILY_CAT_EN: Record<string, string> = {
  "Vivienda": "Housing",
  "Servicios Públicos": "Utilities",
  "Supermercado": "Groceries",
  "Transporte del Hogar": "Household Transport",
  "Mantenimiento": "Maintenance",
  "Seguros del Hogar": "Home Insurance",
  "Otros": "Other",
};

export function familyCategoryLabel(nombre: string, locale: Locale): string {
  if (locale === "en" && FAMILY_CAT_EN[nombre]) return FAMILY_CAT_EN[nombre];
  return nombre;
}
