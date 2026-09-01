"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { InviteCodeBox } from "@/components/hogar/InviteCodeBox";
import { formatoMoneda } from "@/lib/calculations";
import type { Moneda } from "@/lib/types";
import { useT } from "@/components/i18n/I18nProvider";

type Member = { user_id: string; display_name: string; salario_mensual: number };

export function FamilyBudgetCard({
  linked,
  inviteCode,
  members,
  primaria,
  myUserId,
  activateAction,
  joinAction,
  leaveAction,
}: {
  linked: boolean;
  inviteCode: string | null;
  members: Member[];
  primaria: Moneda;
  myUserId: string;
  activateAction: () => void | Promise<void>;
  joinAction: (formData: FormData) => void | Promise<void>;
  leaveAction: () => void | Promise<void>;
}) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const t = useT();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("familyCard.title")}</CardTitle>
      </CardHeader>
      <CardBody>
        {!linked ? (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              {t("familyCard.optionalDesc")}
            </p>

            <form action={activateAction}>
              <Button type="submit">{t("familyCard.activate")}</Button>
            </form>

            <div className="border-t border-border pt-5">
              <form action={joinAction} className="flex items-end gap-2 max-w-sm">
                <Field label={t("familyCard.joinWithCode")}>
                  <Input
                    name="code"
                    placeholder={t("familyCard.codePh")}
                    required
                    className="uppercase tracking-widest"
                  />
                </Field>
                <Button type="submit" variant="secondary">
                  {t("familyCard.join")}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500 mb-3">
                {t("familyCard.shareCode")}
              </p>
              {inviteCode && <InviteCodeBox code={inviteCode} />}
            </div>

            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium text-navy mb-2">
                {t("familyCard.linkedAccounts", { n: members.length })}
              </p>
              <ul className="divide-y divide-border text-sm">
                {members.map((m) => (
                  <li key={m.user_id} className="flex justify-between py-2">
                    <span className="text-gray-700">
                      {m.display_name || "—"}
                      {m.user_id === myUserId && (
                        <span className="text-gray-400"> {t("common.you")}</span>
                      )}
                    </span>
                    <span className="text-gray-500">
                      {t("familyCard.perMonth", { amount: formatoMoneda(m.salario_mensual, primaria) })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-5">
              {confirmLeave ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {t("familyCard.confirmLeave")}
                  </span>
                  <form action={leaveAction}>
                    <Button type="submit" variant="danger">
                      {t("familyCard.yesLeave")}
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmLeave(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmLeave(true)}
                >
                  {t("familyCard.leave")}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
