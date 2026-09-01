"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { InviteCodeBox } from "@/components/hogar/InviteCodeBox";
import { formatoMoneda } from "@/lib/calculations";
import type { Moneda } from "@/lib/types";

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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Presupuesto Familiar</CardTitle>
      </CardHeader>
      <CardBody>
        {!linked ? (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Opcional. Un presupuesto de gastos del hogar compartido con otras
              cuentas, separado de tu espacio personal. Todas las cuentas
              vinculadas deben tener la misma moneda primaria.
            </p>

            <form action={activateAction}>
              <Button type="submit">Activar y generar código</Button>
            </form>

            <div className="border-t border-border pt-5">
              <form action={joinAction} className="flex items-end gap-2 max-w-sm">
                <Field label="Unirme con un código">
                  <Input
                    name="code"
                    placeholder="ABC123"
                    required
                    className="uppercase tracking-widest"
                  />
                </Field>
                <Button type="submit" variant="secondary">
                  Unirme
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Comparte este código para que otra cuenta se una desde su propia
                Configuración.
              </p>
              {inviteCode && <InviteCodeBox code={inviteCode} />}
            </div>

            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium text-navy mb-2">
                Cuentas vinculadas ({members.length})
              </p>
              <ul className="divide-y divide-border text-sm">
                {members.map((m) => (
                  <li key={m.user_id} className="flex justify-between py-2">
                    <span className="text-gray-700">
                      {m.display_name || "—"}
                      {m.user_id === myUserId && (
                        <span className="text-gray-400"> (tú)</span>
                      )}
                    </span>
                    <span className="text-gray-500">
                      {formatoMoneda(m.salario_mensual, primaria)} / mes
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-5">
              {confirmLeave ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    ¿Seguro? Perderás acceso a este Presupuesto Familiar.
                  </span>
                  <form action={leaveAction}>
                    <Button type="submit" variant="danger">
                      Sí, salir
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmLeave(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmLeave(true)}
                >
                  Salir del Presupuesto Familiar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
