import { getPersonalContext, getFamilyBudgetContext } from "@/lib/data";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MonedasCard } from "@/components/config/MonedasCard";
import { FamilyBudgetCard } from "@/components/config/FamilyBudgetCard";
import { simbolo } from "@/lib/currency";
import {
  updateConfig,
  updateMonedas,
  updateProfile,
  activateFamilyBudget,
  joinFamilyBudgetByCode,
  leaveFamilyBudget,
} from "./actions";

const METAS: { key: "meta_gastos" | "meta_ahorro" | "meta_inversion" | "meta_jugar" | "meta_donativos" | "meta_formacion" | "meta_deuda"; label: string; hint: string }[] = [
  { key: "meta_gastos", label: "Meta Gastos", hint: "Máximo recomendado del ingreso disponible" },
  { key: "meta_ahorro", label: "Meta Ahorro", hint: "Mínimo recomendado del ingreso disponible" },
  { key: "meta_inversion", label: "Meta Inversión", hint: "Mínimo recomendado del ingreso disponible" },
  { key: "meta_jugar", label: "Meta Jugar", hint: "Máximo recomendado del ingreso disponible" },
  { key: "meta_donativos", label: "Meta Donativos", hint: "Mínimo recomendado" },
  { key: "meta_formacion", label: "Meta Formación", hint: "Mínimo recomendado" },
  { key: "meta_deuda", label: "Meta Deuda", hint: "Máximo recomendado en cuotas" },
];

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { space, currency, user } = await getPersonalContext();
  const family = await getFamilyBudgetContext();
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Tu perfil, tus metas y tus monedas. El tipo de cambio se edita desde el control fijo arriba a la derecha."
      />

      {error && (
        <p className="mb-6 rounded-lg bg-red/10 px-4 py-3 text-sm text-red">
          {decodeURIComponent(error)}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateProfile} className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <Field label="Mi nombre">
              <Input name="display_name" defaultValue={space.display_name} required />
            </Field>
            <Field label={`Mi salario mensual (${simbolo(currency.primaria)})`}>
              <Input
                type="number"
                step="0.01"
                name="salario_mensual"
                defaultValue={space.salario_mensual}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary">
                Guardar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <MonedasCard
        activas={currency.activas}
        primaria={currency.primaria}
        action={updateMonedas}
      />

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
          <CardTitle>Metas y Parámetros</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateConfig} className="space-y-6">
            <div>
              <p className="text-sm font-medium text-navy mb-3">
                Metas por categoría (% del ingreso disponible)
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {METAS.map((m) => (
                  <Field key={m.key} label={m.label}>
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
                    <p className="text-xs text-gray-400 mt-1">{m.hint}</p>
                  </Field>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6 grid sm:grid-cols-2 gap-4">
              <Field label="Fondo de Emergencia Básico (meses)">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  name="meses_fondo_basico"
                  defaultValue={space.meses_fondo_basico}
                />
              </Field>
              <Field label="Fondo de Emergencia Ideal (meses)">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  name="meses_fondo_ideal"
                  defaultValue={space.meses_fondo_ideal}
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Guardar Configuración</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
