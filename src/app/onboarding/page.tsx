import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";
import { GENEROS, PROFESIONES } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sp } = await supabase
    .from("personal_spaces")
    .select("display_name, genero, fecha_nacimiento")
    .eq("owner_id", user.id)
    .maybeSingle<{ display_name: string; genero: string | null; fecha_nacimiento: string | null }>();

  if (sp?.genero && sp?.fecha_nacimiento) redirect("/");

  const { error } = await searchParams;
  const t = tFor(await getRequestLocale());
  const today = new Date().toISOString().slice(0, 10);
  const defaultName = sp?.display_name || (user.email ?? "").split("@")[0];

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-gold-light text-xs tracking-[0.3em] uppercase mb-1">Finéfica</p>
          <h1 className="text-white text-2xl font-semibold">{t("onboarding.title")}</h1>
          <p className="text-white/60 text-sm mt-1">{t("onboarding.desc")}</p>
        </div>
        <Card className="bg-white">
          <CardBody>
            {error && (
              <p className="mb-4 rounded-lg bg-red/10 px-3 py-2 text-sm text-red">
                {t("onboarding.errRequired")}
              </p>
            )}
            <form action={completeOnboarding} className="grid gap-4 sm:grid-cols-2">
              <Field label={t("onboarding.preferredName")}>
                <Input name="display_name" defaultValue={defaultName} required />
              </Field>
              <Field label={t("onboarding.middleName")}>
                <Input name="segundo_nombre" />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("onboarding.lastNames")}>
                  <Input name="apellidos" required />
                </Field>
              </div>
              <Field label={t("perfil.profession")}>
                <Select name="profesion" defaultValue="" required>
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
                <Select name="genero" defaultValue="" required>
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
                  <Input type="date" name="fecha_nacimiento" max={today} required />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full">
                  {t("onboarding.submit")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
