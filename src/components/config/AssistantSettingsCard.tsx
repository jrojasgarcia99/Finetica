"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";

const MAX = 4000;

export function AssistantSettingsCard({
  current,
  action,
}: {
  current: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [value, setValue] = useState(current);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.assistant")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-3 text-xs text-gray-500">{t("config.assistantDesc")}</p>
        <form action={action} className="space-y-3">
          <textarea
            name="instrucciones"
            rows={7}
            maxLength={MAX}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("config.assistantPlaceholder")}
            className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-navy-light focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              {value.length} / {MAX}
            </span>
            <Button type="submit" variant="secondary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
