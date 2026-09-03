import { LogOut } from "lucide-react";
import { getPersonalContext } from "@/lib/data";
import { tFor } from "@/lib/i18n";
import { edadDesde } from "@/lib/calculations";
import { GENEROS, PROFESIONES } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarPicker } from "@/components/perfil/AvatarPicker";
import { logout } from "@/app/(app)/actions";
import { updateProfileInfo, updateAvatar, removeAvatar } from "./actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, space, locale } = await getPersonalContext();
  const t = tFor(locale);
  const { error } = await searchParams;

  const avatarUrl = space.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(space.avatar_path).data.publicUrl
    : null;
  const edad = edadDesde(space.fecha_nacimiento);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title={t("perfil.title")} description={t("perfil.desc")} />

      {error && (
        <p className="mb-6 rounded-lg bg-red/10 px-4 py-3 text-sm text-red">
          {t(
            error === "size"
              ? "perfil.errSize"
              : error === "type"
                ? "perfil.errType"
                : "perfil.errUpload",
          )}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("perfil.photo")}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-center gap-5">
            <Avatar src={avatarUrl} name={space.display_name} size={80} tone="light" />
            <div className="space-y-3">
              <AvatarPicker action={updateAvatar} hasPhoto={!!avatarUrl} />
              {avatarUrl && (
                <form action={removeAvatar}>
                  <button type="submit" className="text-xs text-red hover:underline">
                    {t("perfil.removePhoto")}
                  </button>
                </form>
              )}
              <p className="text-xs text-gray-400">{t("perfil.photoHint")}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("perfil.personalInfo")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateProfileInfo} className="grid gap-4 sm:grid-cols-2 max-w-xl">
            <Field label={t("perfil.preferredName")}>
              <Input name="display_name" defaultValue={space.display_name} required />
            </Field>
            <Field label={t("perfil.middleName")}>
              <Input name="segundo_nombre" defaultValue={space.segundo_nombre ?? ""} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("perfil.lastNames")}>
                <Input name="apellidos" defaultValue={space.apellidos ?? ""} required />
              </Field>
            </div>
            <Field label={t("perfil.profession")}>
              <Select name="profesion" defaultValue={space.profesion ?? ""} required>
                <option value="" disabled>
                  {t("common.choose")}
                </option>
                {PROFESIONES.map((p) => (
                  <option key={p} value={p}>
                    {t(`profesion.${p}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("perfil.gender")}>
              <Select name="genero" defaultValue={space.genero ?? ""} required>
                <option value="" disabled>
                  {t("common.choose")}
                </option>
                {GENEROS.map((g) => (
                  <option key={g} value={g}>
                    {t(`perfil.gender.${g}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("perfil.birthDate")}>
                <Input
                  type="date"
                  name="fecha_nacimiento"
                  max={today}
                  defaultValue={space.fecha_nacimiento ?? ""}
                  required
                />
              </Field>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {edad !== null ? t("perfil.ageIs", { n: edad }) : t("perfil.ageUnset")}
              </p>
              <Button type="submit" variant="secondary">
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-red hover:bg-red/5"
            >
              <LogOut size={16} />
              {t("shell.logout")}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
