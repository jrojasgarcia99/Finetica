import { getPersonalContext, getFamilyBudgetContext } from "@/lib/data";
import { tFor } from "@/lib/i18n";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MonedasCard } from "@/components/config/MonedasCard";
import { FamilyBudgetCard } from "@/components/config/FamilyBudgetCard";
import { LanguageCard } from "@/components/config/LanguageCard";
import { simbolo } from "@/lib/currency";
import type { TKey } from "@/lib/i18n";
import {
  updateConfig,
  updateMonedas,
  updateProfile,
  updateIdioma,
  activateFamilyBudget,
  joinFamilyBudgetByCode,
  leaveFamilyBudget,
} from "./actions";

const METAS: {
  key: "meta_gastos" | "meta_ahorro" | "meta_inversion" | "meta_jugar" | "meta_donativos" | "meta_formacion" | "meta_deuda";
  labelKey: TKey;
  hintKey: TKey;
}[] = [
  { key: "meta_gastos", labelKey: "config.metaGastos", hintKey: "config.hintMax" },
  { key: "meta_ahorro", labelKey: "config.metaAhorro", hintKey: "config.hintMin" },
  { key: "meta_inversion", labelKey: "config.metaInversion", hintKey: "config.hintMin" },
  { key: "meta_jugar", labelKey: "config.metaJugar", hintKey: "config.hintMax" },
  { key: "meta_donativos", labelKey: "config.metaDonativos", hintKey: "config.hintMinShort" },
  { key: "meta_formacion", labelKey: "config.metaFormacion", hintKey: "config.hintMinShort" },
  { key: "meta_deuda", labelKey: "config.metaDeuda", hintKey: "config.hintDebt" },
];

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { space, currency, user, locale } = await getPersonalContext();
  const t = tFor(locale);
  const family = await getFamilyBudgetContext();
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader title={t("config.title")} description={t("config.desc")} />

      {error && (
        <p className="mb-6 rounded-lg bg-red/10 px-4 py-3 text-sm text-red">
          {decodeURIComponent(error)}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("config.myProfile")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateProfile} className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <Field label={t("config.myName")}>
              <Input name="display_name" defaultValue={space.display_name} required />
            </Field>
            <Field label={t("config.mySalary", { sym: simbolo(currency.primaria) })}>
              <Input
                type="number"
                step="0.01"
                name="salario_mensual"
                defaultValue={space.salario_mensual}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary">
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <LanguageCard current={locale} action={updateIdioma} />

      <MonedasCard activas={currency.activas} primaria={currency.primaria} action={updateMonedas} />

      <FamilyBudgetCard
        linked={family !== null}
        inviteCode={family?.familyBudget.invite_code ?? null}
        members={
          family?.members.map((m) => ({
            user_id: m.user_id,
            display_name: m.display_name,
            salario_mensual: m.salario_mensual,
          })) ?? []
        }
        primaria={family?.currency.primaria ?? currency.primaria}
        myUserId={user.id}
        activateAction={activateFamilyBudget}
        joinAction={joinFamilyBudgetByCode}
        leaveAction={leaveFamilyBudget}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("config.goalsParams")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateConfig} className="space-y-6">
            <div>
              <p className="text-sm font-medium text-navy mb-3">{t("config.goalsByCategory")}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {METAS.map((m) => (
                  <Field key={m.key} label={t(m.labelKey)}>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        name={m.key}
                        defaultValue={Number((space[m.key] * 100).toFixed(2))}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t(m.hintKey)}</p>
                  </Field>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6 grid sm:grid-cols-2 gap-4">
              <Field label={t("config.fundBasicMonths")}>
                <Input type="number" step="1" min="0" name="meses_fondo_basico" defaultValue={space.meses_fondo_basico} />
              </Field>
              <Field label={t("config.fundIdealMonths")}>
                <Input type="number" step="1" min="0" name="meses_fondo_ideal" defaultValue={space.meses_fondo_ideal} />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button type="submit">{t("config.saveConfig")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
