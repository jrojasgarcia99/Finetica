"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/locale";
import { edadDesde } from "@/lib/calculations";
import { GENEROS, PROFESIONES } from "@/lib/types";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const idioma = await getRequestLocale(); // el idioma elegido en las banderas

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

  const edad = edadDesde(fecha_nacimiento);
  if (edad === null || edad < 15) redirect("/onboarding?error=minage");

  // upsert: crea la fila si el usuario nuevo aún no tiene espacio, o la completa
  // si ya existe. No toca el resto de columnas.
  const { error } = await supabase
    .from("personal_spaces")
    .upsert(
      {
        owner_id: user.id,
        display_name,
        segundo_nombre,
        apellidos,
        profesion,
        genero,
        fecha_nacimiento,
        idioma,
      },
      { onConflict: "owner_id" },
    );
  if (error) {
    console.error("completeOnboarding upsert failed:", error.message);
    redirect("/onboarding?error=1");
  }

  redirect("/");
}
