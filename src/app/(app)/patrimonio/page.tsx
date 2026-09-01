import { getHouseholdContext } from "@/lib/data";
import { calcularPosicionPatrimonial, formatoColones } from "@/lib/calculations";
import type { Activo, Pasivo, Deuda } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ValueListCard } from "@/components/patrimonio/ValueListCard";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addActivo, deleteActivo, addPasivo, deletePasivo, updateEdad } from "./actions";

export default async function PatrimonioPage() {
  const { supabase, household, members } = await getHouseholdContext();

  const [{ data: activos }, { data: pasivos }, { data: deudas }] = await Promise.all([
    supabase.from("activos").select("*").eq("household_id", household.id).order("created_at"),
    supabase.from("pasivos").select("*").eq("household_id", household.id).order("created_at"),
    supabase.from("deudas").select("*").eq("household_id", household.id),
  ]);

  const activosList = (activos ?? []) as Activo[];
  const pasivosList = (pasivos ?? []) as Pasivo[];
  const deudasList = (deudas ?? []) as Deuda[];

  const totalActivos = activosList.reduce((a, x) => a + Number(x.valor), 0);
  const totalPasivosVarios = pasivosList.reduce((a, x) => a + Number(x.valor), 0);
  const saldoDeudas = deudasList
    .filter((d) => d.estado === "Activa")
    .reduce((a, d) => a + Number(d.saldo_actual), 0);
  const totalPasivos = totalPasivosVarios + saldoDeudas;
  const patrimonioNeto = totalActivos - totalPasivos;

  const salarioAnual = members.reduce((a, m) => a + Number(m.salario_mensual), 0) * 12;
  const posicion = calcularPosicionPatrimonial(
    salarioAnual,
    household.patrimonio_edad,
    patrimonioNeto,
  );

  const posicionLabel: Record<string, { texto: string; color: string }> = {
    PAR: { texto: "PAR — Prodigioso Acumulador de Riqueza", color: "text-green" },
    MAR: { texto: "MAR — Mediano Acumulador de Riqueza", color: "text-gold" },
    SAR: { texto: "SAR — Sub Acumulador de Riqueza", color: "text-red" },
  };

  return (
    <div>
      <PageHeader
        title="Patrimonio Neto"
        description="Activos, pasivos, patrimonio y posición patrimonial."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Total Activos</p>
          <p className="text-xl font-semibold text-green">{formatoColones(totalActivos)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Total Pasivos (incl. deudas)</p>
          <p className="text-xl font-semibold text-red">{formatoColones(totalPasivos)}</p>
        </Card>
        <Card className="p-4 bg-navy">
          <p className="text-xs text-white/60 uppercase">Patrimonio Neto</p>
          <p className="text-xl font-semibold text-white">{formatoColones(patrimonioNeto)}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <ValueListCard
          title="Activos"
          items={activosList.map((a) => ({ id: a.id, concepto: a.concepto, valor: Number(a.valor) }))}
          total={totalActivos}
          totalColor="green"
          addAction={addActivo}
          deleteAction={deleteActivo}
        />
        <ValueListCard
          title="Pasivos (otros, sin contar deudas)"
          items={pasivosList.map((p) => ({ id: p.id, concepto: p.concepto, valor: Number(p.valor) }))}
          total={totalPasivosVarios}
          totalColor="red"
          addAction={addPasivo}
          deleteAction={deletePasivo}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posición Patrimonial — Método PAR / MAR / SAR</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-gray-500 mb-4">
            Metodología de T. Stanley y W. Danko (&quot;The Millionaire Next Door&quot;):
            Patrimonio Deseado = Salario Anual del hogar × Edad ÷ 10. Es una guía orientativa, no
            una meta absoluta.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Salario Anual del Hogar</span>
                <span className="font-medium">{formatoColones(salarioAnual)}</span>
              </div>
              <form action={updateEdad} className="flex items-end gap-2">
                <Field label="Edad de referencia">
                  <Input
                    type="number"
                    name="edad"
                    defaultValue={household.patrimonio_edad ?? ""}
                    placeholder="Ej. 35"
                  />
                </Field>
                <Button type="submit" variant="secondary">
                  Guardar
                </Button>
              </form>
              {posicion.posicion && (
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-500">Patrimonio Deseado</span>
                  <span className="font-medium">{formatoColones(posicion.patrimonioDeseado)}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-4 flex flex-col justify-center items-center text-center">
              {posicion.posicion ? (
                <>
                  <p className="text-xs text-gray-500 uppercase mb-1">Tu posición actual</p>
                  <p className={`text-lg font-semibold ${posicionLabel[posicion.posicion].color}`}>
                    {posicionLabel[posicion.posicion].texto}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    PAR ≥ {formatoColones(posicion.umbralPAR)} · SAR ≤{" "}
                    {formatoColones(posicion.umbralSAR)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  Ingresa tu edad de referencia para calcular tu posición.
                </p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
