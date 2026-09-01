"use client";

import { Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";

export function PaymentMethodsCard({
  methods,
  addAction,
  deleteAction,
}: {
  methods: { id: string; nombre: string }[];
  addAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.paymentMethods")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-3 text-xs text-gray-500">{t("config.paymentMethodsDesc")}</p>

        <ul className="mb-4 divide-y divide-border text-sm">
          {methods.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{m.nombre}</span>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  className="text-gray-300 hover:text-red"
                  aria-label={t("common.delete")}
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </li>
          ))}
          {methods.length === 0 && (
            <li className="py-2 text-gray-400">{t("config.paymentMethodsEmpty")}</li>
          )}
        </ul>

        <form action={addAction} className="flex max-w-sm items-end gap-2">
          <Field label={t("config.paymentMethodName")}>
            <Input name="nombre" required />
          </Field>
          <Button type="submit" variant="secondary">
            {t("common.add")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
