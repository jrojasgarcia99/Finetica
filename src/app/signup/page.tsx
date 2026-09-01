import Link from "next/link";
import { signup } from "./actions";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = tFor(await getRequestLocale());

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold-light text-xs tracking-[0.3em] uppercase mb-1">Finéfica</p>
          <h1 className="text-white text-2xl font-semibold">{t("auth.signupTitle")}</h1>
          <p className="text-white/60 text-sm mt-1">{t("auth.signupSubtitle")}</p>
        </div>
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
              {error && (
                <p className="text-sm text-red bg-red/10 rounded-lg px-3 py-2">
                  {decodeURIComponent(error)}
                </p>
              )}
              <Button type="submit" className="w-full">
                {t("auth.createAccount")}
              </Button>
            </form>
          </CardBody>
        </Card>
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
