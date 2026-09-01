import Link from "next/link";
import { signup } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold-light text-xs tracking-[0.3em] uppercase mb-1">Finéfica</p>
          <h1 className="text-white text-2xl font-semibold">Crear cuenta</h1>
          <p className="text-white/60 text-sm mt-1">
            Diseña, construye y sostén tu libertad financiera.
          </p>
        </div>
        <Card className="bg-white">
          <CardBody>
            <form action={signup} className="space-y-4">
              <Field label="Correo electrónico">
                <Input type="email" name="email" required autoComplete="email" />
              </Field>
              <Field label="Contraseña (mínimo 8 caracteres)">
                <Input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              {error && (
                <p className="text-sm text-red bg-red/10 rounded-lg px-3 py-2">
                  {decodeURIComponent(error)}
                </p>
              )}
              <Button type="submit" className="w-full">
                Crear cuenta
              </Button>
            </form>
          </CardBody>
        </Card>
        <p className="text-center text-white/70 text-sm mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-gold-light font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
