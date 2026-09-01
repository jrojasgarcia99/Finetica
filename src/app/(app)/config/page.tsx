import { getHouseholdContext } from "@/lib/data";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateConfig, updateHouseholdName } from "./actions";

const METAS: { key: "meta_gastos" | "meta_ahorro" | "meta_inversion" | "meta_jugar" | "meta_donativos" | "meta_formacion" | "meta_deuda"; label: string; hint: string }[] = [
  { key: "meta_gastos", label: "Meta Gastos", hint: "Máximo recomendado del ingreso disponible" },
  { key: "meta_ahorro", label: "Meta Ahorro", hint: "Mínimo recomendado del ingreso disponible" },
  { key: "meta_inversion", label: "Meta Inversión", hint: "Mínimo recomendado del ingreso disponible" },
  { key: "meta_jugar", label: "Meta Jugar", hint: "Máximo recomendado del ingreso disponible" },
  { key: "meta_donativos", label: "Meta Donativos", hint: "Mínimo recomendado" },
  { key: "meta_formacion", label: "Meta Formación", hint: "Mínimo recomendado" },
  { key: "meta_deuda", label: "Meta Deuda", hint: "Máximo recomendado en cuotas" },
];

export default async function ConfigPage() {
  const { household } = await getHouseholdContext();

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Los cimientos de tu sistema: metas, tipo de cambio y datos de tu hogar."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nombre del Hogar</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateHouseholdName} className="flex items-end gap-2 max-w-sm">
            <Field label="Nombre">
              <Input name="name" defaultValue={household.name} required />
            </Field>
            <Button type="submit" variant="secondary">
              Guardar
            </Button>
          </form>
        </CardBody>
      </Card>

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
                        defaultValue={Number((household[m.key] * 100).toFixed(2))}
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

            <div className="border-t border-border pt-6 grid sm:grid-cols-3 gap-4">
              <Field label="Tipo de Cambio (₡ por $1)">
                <Input
                  type="number"
                  step="0.01"
                  name="tipo_cambio"
                  defaultValue={household.tipo_cambio}
                />
              </Field>
              <Field label="Fondo de Emergencia Básico (meses)">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  name="meses_fondo_basico"
                  defaultValue={household.meses_fondo_basico}
                />
              </Field>
              <Field label="Fondo de Emergencia Ideal (meses)">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  name="meses_fondo_ideal"
                  defaultValue={household.meses_fondo_ideal}
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
