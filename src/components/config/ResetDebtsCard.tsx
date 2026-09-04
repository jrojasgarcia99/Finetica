"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { useT } from "@/components/i18n/I18nProvider";

export function ResetDebtsCard({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.resetDebts")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-3 text-xs text-gray-500">{t("config.resetDebtsDesc")}</p>
        <ConfirmButton
          action={action}
          title={t("config.resetDebts")}
          message={t("config.resetDebtsConfirm")}
          confirmLabel={t("config.resetDebtsBtn")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-[15px] font-medium text-navy transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {t("config.resetDebtsBtn")}
        </ConfirmButton>
      </CardBody>
    </Card>
  );
}
