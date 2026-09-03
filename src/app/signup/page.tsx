import Link from "next/link";
import { MailCheck } from "lucide-react";
import { signup } from "./actions";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { AuthLangSelect } from "@/components/auth/AuthLangSelect";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const locale = await getRequestLocale();
  const t = tFor(locale);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold-light text-xs tracking-[0.3em] uppercase mb-1">Finéfica</p>
          <h1 className="text-white text-2xl font-semibold">{t("auth.signupTitle")}</h1>
          <p className="text-white/60 text-sm mt-1">{t("auth.signupSubtitle")}</p>
        </div>

        {sent ? (
          <Card className="bg-white">
            <CardBody className="text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-navy/10 text-navy">
                <MailCheck size={24} />
              </div>
              <h2 className="font-semibold text-navy">{t("auth.checkEmailTitle")}</h2>
              <p className="mt-2 text-sm text-gray-600">{t("auth.checkEmailBody")}</p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-medium text-navy-light hover:underline"
              >
                {t("auth.login")}
              </Link>
            </CardBody>
          </Card>
        ) : (
          <Card className="bg-white">
            <CardBody>
              <form action={signup} className="space-y-4">
                <Field label={t("auth.email")}>
                  <Input type="email" name="email" required autoComplete="email" />
                </Field>
                <Field label={t("auth.password")}>
                  <Input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label={t("auth.language")}>
                  <AuthLangSelect current={locale} />
                </Field>
                {error && (
                  <p className="text-sm text-red bg-red/10 rounded-lg px-3 py-2">
                    {decodeURIComponent(error)}
                  </p>
                )}
                <Button type="submit" className="w-full">
                  {t("auth.createAccount")}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-border" />
                {t("auth.orDivider")}
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleButton label={t("auth.google")} />
            </CardBody>
          </Card>
        )}

        <p className="text-center text-white/70 text-sm mt-4">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-gold-light font-medium hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
