"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";
import { normalizeLocale, tFor } from "@/lib/i18n";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const lang = normalizeLocale(formData.get("lang"));

  // El idioma elegido acá manda: cookie para el resto del flujo y la app.
  (await cookies()).set(LOCALE_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const t = tFor(lang);
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent(t("err.passwordMin"))}`);
  }

  const h = await headers();
  const host = h.get("host");
  const origin = h.get("origin") ?? (host ? `https://${host}` : "");

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { lang },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Supabase no da error si el correo ya existe (anti-enumeración): lo delata
  // que `identities` venga vacío. Acá sí lo avisamos.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    redirect(`/signup?error=${encodeURIComponent(t("err.emailTaken"))}`);
  }

  // Sin sesión ⇒ el proyecto pide confirmación por correo: pantalla amigable.
  if (!data.session) {
    redirect("/signup?sent=1");
  }

  redirect("/");
}
