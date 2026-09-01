"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres.")}`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Si el proyecto de Supabase requiere confirmación por correo, no habrá
  // sesión todavía.
  if (!data.session) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Revisa tu correo para confirmar la cuenta y luego inicia sesión.",
      )}`,
    );
  }

  redirect("/dashboard");
}
