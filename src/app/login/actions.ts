"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";
import { normalizeLocale, tFor } from "@/lib/i18n";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const lang = normalizeLocale(formData.get("lang"));

  (await cookies()).set(LOCALE_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const t = tFor(lang);
    const msg = /invalid login credentials/i.test(error.message)
      ? t("err.invalidLogin")
      : error.message;
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }
  // La raíz decide la pantalla de inicio según nav_order del usuario.
  redirect("/");
}
