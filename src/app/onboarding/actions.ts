"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GENEROS, PROFESIONES } from "@/lib/types";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = String(formData.get("display_name") || "").trim();
  const segundo_nombre = String(formData.get("segundo_nombre") || "").trim() || null;
  const apellidos = String(formData.get("apellidos") || "").trim();
  const profesion = String(formData.get("profesion") || "");
  const genero = String(formData.get("genero") || "");
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") || "").trim();

  const ok =
    display_name &&
    apellidos &&
    PROFESIONES.includes(profesion as (typeof PROFESIONES)[number]) &&
    GENEROS.includes(genero as (typeof GENEROS)[number]) &&
    fecha_nacimiento;
  if (!ok) redirect("/onboarding?error=1");

  await supabase
    .from("personal_spaces")
    .update({ display_name, segundo_nombre, apellidos, profesion, genero, fecha_nacimiento })
    .eq("owner_id", user.id);

  redirect("/");
}
