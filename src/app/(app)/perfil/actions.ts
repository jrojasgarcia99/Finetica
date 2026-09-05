"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { edadDesde } from "@/lib/calculations";
import { GENEROS, PROFESIONES } from "@/lib/types";

const MAX_BYTES = 3 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function updateProfileInfo(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const display_name = String(formData.get("display_name") || "").trim();
  const segundo_nombre = String(formData.get("segundo_nombre") || "").trim();
  const apellidos = String(formData.get("apellidos") || "").trim();
  const profesion = String(formData.get("profesion") || "");
  const genero = String(formData.get("genero") || "");
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") || "").trim();

  if (fecha_nacimiento) {
    const edad = edadDesde(fecha_nacimiento);
    if (edad === null || edad < 15) redirect("/perfil?error=minage");
  }

  const update: Record<string, unknown> = {};
  if (display_name) update.display_name = display_name;
  if (formData.has("segundo_nombre")) update.segundo_nombre = segundo_nombre || null;
  if (apellidos) update.apellidos = apellidos;
  if (PROFESIONES.includes(profesion as (typeof PROFESIONES)[number])) update.profesion = profesion;
  if (GENEROS.includes(genero as (typeof GENEROS)[number])) update.genero = genero;
  if (fecha_nacimiento) update.fecha_nacimiento = fecha_nacimiento;
  if (Object.keys(update).length === 0) return;

  await supabase.from("personal_spaces").update(update).eq("id", space.id);

  revalidatePath("/", "layout");
  revalidatePath("/perfil");
  revalidatePath("/patrimonio");
  revalidatePath("/dashboard");
}

export async function updateAvatar(formData: FormData) {
  const { space, user, supabase } = await getPersonalContext();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return;
  if (!EXT[file.type]) redirect("/perfil?error=type");
  if (file.size > MAX_BYTES) redirect("/perfil?error=size");

  const path = `${user.id}/${Date.now()}.${EXT[file.type]}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    console.error("updateAvatar upload failed:", error.message);
    redirect("/perfil?error=upload");
  }

  if (space.avatar_path && space.avatar_path !== path) {
    await supabase.storage.from("avatars").remove([space.avatar_path]);
  }
  await supabase.from("personal_spaces").update({ avatar_path: path }).eq("id", space.id);

  revalidatePath("/", "layout");
  revalidatePath("/perfil");
}

export async function removeAvatar() {
  const { space, supabase } = await getPersonalContext();
  if (space.avatar_path) {
    await supabase.storage.from("avatars").remove([space.avatar_path]);
  }
  await supabase.from("personal_spaces").update({ avatar_path: null }).eq("id", space.id);

  revalidatePath("/", "layout");
  revalidatePath("/perfil");
}

/**
 * Borra la cuenta del usuario actual y TODOS sus datos, de forma permanente.
 * El esquema ya tiene "on delete cascade" desde personal_spaces (y desde
 * family_budget_members) hasta auth.users, así que borrar el usuario de auth
 * se lleva todo lo demás (presupuesto, deudas, sobres, movimientos, etc.) sin
 * necesidad de borrar tabla por tabla. Requiere la service_role key porque
 * borrar de auth.users no es algo que la sesión normal pueda hacer.
 */
export async function deleteAccount() {
  const { space, user, supabase } = await getPersonalContext();

  if (space.avatar_path) {
    await supabase.storage.from("avatars").remove([space.avatar_path]);
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`No se pudo eliminar la cuenta: ${error.message}`);
  }

  await supabase.auth.signOut();
  redirect("/login?deleted=true");
}
