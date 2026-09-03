"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const t = tFor(await getRequestLocale());

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent(t("err.passwordMin"))}`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Si el proyecto de Supabase requiere confirmación por correo, no habrá sesión.
  if (!data.session) {
    redirect(`/login?error=${encodeURIComponent(t("err.checkEmail"))}`);
  }

  redirect("/");
}
