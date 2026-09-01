import { cookies, headers } from "next/headers";
import type { Locale } from "@/lib/types";
import { normalizeLocale } from "./index";

export const LOCALE_COOKIE = "finefica_lang";

/**
 * Idioma para páginas SIN sesión (login/signup/onboarding, root layout):
 * cookie `finefica_lang` → cabecera Accept-Language → 'es'.
 */
export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie === "es" || fromCookie === "en") return fromCookie;

  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("en") ? "en" : "es";
}

export { normalizeLocale };
export type { Locale };
