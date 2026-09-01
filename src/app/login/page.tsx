import Link from "next/link";
import { login } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

export default async function LoginPage({
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
          <h1 className="text-white text-2xl font-semibold">Presupuesto</h1>
          <p className="text-white/60 text-sm mt-1">
            Financial freedom is built, not found.
          </p>
        </div>
        <Card className="bg-white">
          <CardBody>
            <form action={login} className="space-y-4">
              <Field label="Correo electrónico">
                <Input type="email" name="email" required autoComplete="email" />
              </Field>
              <Field label="Contraseña">
                <Input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              {error && (
                <p className="text-sm text-red bg-red/10 rounded-lg px-3 py-2">
                  {decodeURIComponent(error)}
                </p>
              )}
              <Button type="submit" className="w-full">
                Iniciar sesión
              </Button>
            </form>
          </CardBody>
        </Card>
        <p className="text-center text-white/70 text-sm mt-4">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/signup" className="text-gold-light font-medium hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
