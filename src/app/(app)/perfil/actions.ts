"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPersonalContext } from "@/lib/data";
import { GENEROS } from "@/lib/types";

const MAX_BYTES = 3 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function updateProfileInfo(formData: FormData) {
  const { space, supabase } = await getPersonalContext();

  const genero = String(formData.get("genero") || "");
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") || "").trim();

  const update: Record<string, unknown> = {};
  if (GENEROS.includes(genero as (typeof GENEROS)[number])) update.genero = genero;
  if (fecha_nacimiento) update.fecha_nacimiento = fecha_nacimiento;
  if (Object.keys(update).length === 0) return;

  await supabase.from("personal_spaces").update(update).eq("id", space.id);

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
