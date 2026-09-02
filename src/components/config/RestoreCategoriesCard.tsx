"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";

export function RestoreCategoriesCard({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.restoreCategories")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-3 text-xs text-gray-500">{t("config.restoreCategoriesDesc")}</p>
        <form
          action={action}
          onSubmit={(e) => {
            if (!confirm(t("config.restoreCategoriesConfirm"))) e.preventDefault();
          }}
        >
          <Button type="submit" variant="secondary">
            {t("config.restoreCategoriesBtn")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
