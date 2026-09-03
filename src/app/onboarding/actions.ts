"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GENEROS } from "@/lib/types";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = String(formData.get("display_name") || "").trim();
  const genero = String(formData.get("genero") || "");
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") || "").trim();

  if (!display_name || !GENEROS.includes(genero as (typeof GENEROS)[number]) || !fecha_nacimiento) {
    redirect("/onboarding?error=1");
  }

  await supabase
    .from("personal_spaces")
    .update({ display_name, genero, fecha_nacimiento })
    .eq("owner_id", user.id);

  redirect("/");
}
