"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const t = tFor(await getRequestLocale());
    const msg = /invalid login credentials/i.test(error.message)
      ? t("err.invalidLogin")
      : error.message;
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }
  // La raíz decide la pantalla de inicio según nav_order del usuario.
  redirect("/");
}
