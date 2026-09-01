import { createHousehold, joinHousehold } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-navy px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <p className="text-gold-light text-xs tracking-[0.3em] uppercase mb-1">Finéfica</p>
          <h1 className="text-white text-2xl font-semibold">Empecemos a construir</h1>
          <p className="text-white/60 text-sm mt-1">
            Crea tu hogar financiero, o únete a uno que ya exista con un código de invitación.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red bg-white rounded-lg px-3 py-2 mb-4">
            {decodeURIComponent(error)}
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Crear un hogar nuevo</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={createHousehold} className="space-y-4">
                <Field label="Nombre del hogar">
                  <Input name="hh_name" placeholder="Familia Rojas" required />
                </Field>
                <Field label="Tu nombre">
                  <Input name="member_name" placeholder="José" required />
                </Field>
                <Button type="submit" className="w-full">
                  Crear hogar
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Unirme a un hogar</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={joinHousehold} className="space-y-4">
                <Field label="Código de invitación">
                  <Input
                    name="code"
                    placeholder="ABC123"
                    required
                    className="uppercase tracking-widest"
                  />
                </Field>
                <Field label="Tu nombre">
                  <Input name="member_name" placeholder="María" required />
                </Field>
                <Button type="submit" variant="secondary" className="w-full">
                  Unirme
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          El código de invitación de tu hogar lo encontrarás luego en Configuración, para
          compartirlo con tu pareja o familia.
        </p>
      </div>
    </div>
  );
}
