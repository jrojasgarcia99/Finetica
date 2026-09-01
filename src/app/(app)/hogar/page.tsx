import { getHouseholdContext } from "@/lib/data";
import { formatoColones, formatoPct } from "@/lib/calculations";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateMySalary, updateMyName } from "./actions";
import { InviteCodeBox } from "@/components/hogar/InviteCodeBox";

export default async function HogarPage() {
  const { household, members, member } = await getHouseholdContext();
  const totalSalarios = members.reduce((a, m) => a + Number(m.salario_mensual), 0);

  return (
    <div>
      <PageHeader
        title="Gastos del Hogar"
        description="Los miembros de tu hogar y cómo se reparte la carga financiera."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invitar a tu hogar</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-500 mb-3">
            Comparte este código con tu pareja o familia para que se unan a{" "}
            <strong>{household.name}</strong> con su propia cuenta.
          </p>
          <InviteCodeBox code={household.invite_code} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mi información</CardTitle>
        </CardHeader>
        <CardBody className="grid sm:grid-cols-2 gap-6">
          <form action={updateMyName} className="flex items-end gap-2">
            <Field label="Mi nombre">
              <Input name="display_name" defaultValue={member.display_name} required />
            </Field>
            <Button type="submit" variant="secondary">
              Guardar
            </Button>
          </form>
          <form action={updateMySalary} className="flex items-end gap-2">
            <Field label="Mi salario mensual (₡)">
              <Input
                type="number"
                step="0.01"
                name="salario_mensual"
                defaultValue={member.salario_mensual}
              />
            </Field>
            <Button type="submit" variant="secondary">
              Guardar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Miembros del Hogar</CardTitle>
          <span className="text-sm font-semibold text-navy">
            {formatoColones(totalSalarios)} / mes
          </span>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-border">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Salario Mensual</th>
                <th className="py-2 pr-3">% Participación</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3">
                    {m.display_name}
                    {m.id === member.id && <span className="text-gray-400"> (tú)</span>}
                  </td>
                  <td className="py-2 pr-3">{formatoColones(m.salario_mensual)}</td>
                  <td className="py-2 pr-3">
                    {formatoPct(totalSalarios ? m.salario_mensual / totalSalarios : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
