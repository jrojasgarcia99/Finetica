"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import type { Locale } from "@/lib/types";

export function LanguageCard({
  current,
  action,
}: {
  current: Locale;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.language")}</CardTitle>
      </CardHeader>
      <CardBody>
        <form action={action} className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="idioma"
              value="es"
              defaultChecked={current === "es"}
              className="h-4 w-4 border-border accent-navy"
            />
            {t("config.languageSpanish")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="idioma"
              value="en"
              defaultChecked={current === "en"}
              className="h-4 w-4 border-border accent-navy"
            />
            {t("config.languageEnglish")}
          </label>
          <Button type="submit" variant="secondary">
            {t("common.save")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
