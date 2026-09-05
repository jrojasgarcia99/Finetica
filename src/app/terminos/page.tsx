import Link from "next/link";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";
import { BrandMark } from "@/components/ui/BrandMark";

const LAST_UPDATED = "4 de septiembre de 2026";

export const metadata = {
  title: "Términos de servicio — Finéticap",
};

export default async function TerminosPage() {
  const locale = await getRequestLocale();
  const t = tFor(locale);
  const es = locale !== "en";

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link href="/login" className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="text-sm font-semibold text-navy">Finéticap</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-foreground">
        <h1 className="mb-1 text-2xl font-semibold text-navy">
          {es ? "Términos de servicio" : "Terms of Service"}
        </h1>
        <p className="mb-8 text-xs text-gray-400">
          {es ? `Última actualización: ${LAST_UPDATED}` : `Last updated: ${LAST_UPDATED}`}
        </p>

        {es ? <ContentEs /> : <ContentEn />}

        <p className="mt-10 flex gap-4 text-xs text-gray-400">
          <Link href="/privacidad" className="text-navy-light hover:underline">
            {t("legal.privacy")}
          </Link>
          <Link href="/seguridad" className="text-navy-light hover:underline">
            {t("legal.security")}
          </Link>
        </p>
      </main>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-8 text-base font-semibold text-navy first:mt-0">{children}</h2>;
}

function ContentEs() {
  return (
    <div className="space-y-4">
      <p>
        Al crear una cuenta o usar <strong>Finéticap</strong> (&ldquo;la App&rdquo;,
        &ldquo;nosotros&rdquo;) aceptás estos términos. Finéticap es operada por{" "}
        <strong>Jesús Rojas García</strong>, persona individual, con domicilio en Costa Rica.
      </p>

      <H2>1. Qué es el servicio</H2>
      <p>
        Finéticap es una herramienta de organización y seguimiento de finanzas personales y
        familiares. <strong>No es asesoría financiera, legal ni fiscal profesional.</strong> El
        asistente de inteligencia artificial es una herramienta educativa que interpreta los
        números que vos mismo ingresaste — no es un asesor financiero licenciado, y sus respuestas
        no reemplazan el criterio de un profesional.
      </p>

      <H2>2. Tu cuenta</H2>
      <p>
        Sos responsable de mantener segura tu contraseña y de la veracidad de los datos que
        ingresás. Debés tener al menos 15 años para usar la App.
      </p>

      <H2>3. Uso aceptable</H2>
      <p>
        No podés usar la App para fines ilegales, ni intentar vulnerar su seguridad o acceder a
        datos de otras cuentas.
      </p>

      <H2>4. Presupuesto Familiar</H2>
      <p>
        Si te unís a un Presupuesto Familiar, cierta información (nombre, ingreso disponible o
        salario fijo, y las líneas de gasto compartidas) queda visible para los demás miembros de
        ese grupo. Ver la Política de Privacidad para el detalle exacto.
      </p>

      <H2>5. Disponibilidad del servicio</H2>
      <p>
        La App se ofrece &ldquo;tal cual&rdquo;, sin garantía de disponibilidad ininterrumpida.
        Puede haber mantenimiento, cambios o interrupciones sin previo aviso.
      </p>

      <H2>6. Límite de responsabilidad</H2>
      <p>
        En la medida que lo permita la ley costarricense, Finéticap y Jesús Rojas García no son
        responsables por decisiones financieras que tomés basándote en la información de la App, ni
        por pérdidas derivadas de su uso o de una interrupción del servicio.
      </p>

      <H2>7. Propiedad</H2>
      <p>
        El código, el diseño y la marca de la App nos pertenecen. Los datos financieros que vos
        ingresás te pertenecen a vos.
      </p>

      <H2>8. Eliminar tu cuenta</H2>
      <p>
        Podés eliminar tu cuenta cuando quieras desde Perfil → Eliminar cuenta — esto borra tus
        datos de forma permanente e inmediata. También podemos suspender cuentas que violen estos
        términos.
      </p>

      <H2>9. Cambios a estos términos</H2>
      <p>
        Si cambiamos estos términos de forma importante, te lo vamos a avisar dentro de la App.
      </p>

      <H2>10. Ley aplicable</H2>
      <p>Estos términos se rigen por las leyes de Costa Rica.</p>

      <H2>11. Contacto</H2>
      <p>
        Jesús Rojas García —{" "}
        <a href="mailto:contacto@fineticap.com" className="text-navy-light hover:underline">
          contacto@fineticap.com
        </a>
      </p>
    </div>
  );
}

function ContentEn() {
  return (
    <div className="space-y-4">
      <p>
        By creating an account or using <strong>Finéticap</strong> (&ldquo;the App&rdquo;,
        &ldquo;we&rdquo;) you agree to these terms. Finéticap is operated by{" "}
        <strong>Jesús Rojas García</strong>, an individual, based in Costa Rica.
      </p>

      <H2>1. What the service is</H2>
      <p>
        Finéticap is a tool for organizing and tracking personal and family finances.{" "}
        <strong>It is not professional financial, legal, or tax advice.</strong> The AI assistant
        is an educational tool that interprets the numbers you entered yourself — it is not a
        licensed financial advisor, and its replies don&apos;t replace a professional&apos;s
        judgment.
      </p>

      <H2>2. Your account</H2>
      <p>
        You&apos;re responsible for keeping your password secure and for the accuracy of the data
        you enter. You must be at least 15 years old to use the App.
      </p>

      <H2>3. Acceptable use</H2>
      <p>
        You may not use the App for illegal purposes, or attempt to compromise its security or
        access other accounts&apos; data.
      </p>

      <H2>4. Family Budget</H2>
      <p>
        If you join a Family Budget, certain information (name, available income or fixed salary,
        and the shared budget lines) becomes visible to the other members of that group. See the
        Privacy Policy for the exact detail.
      </p>

      <H2>5. Service availability</H2>
      <p>
        The App is provided &ldquo;as is&rdquo;, with no guarantee of uninterrupted availability.
        There may be maintenance, changes, or interruptions without prior notice.
      </p>

      <H2>6. Limitation of liability</H2>
      <p>
        To the extent permitted by Costa Rican law, Finéticap and Jesús Rojas García are not liable
        for financial decisions you make based on the App&apos;s information, nor for losses
        arising from its use or from a service interruption.
      </p>

      <H2>7. Ownership</H2>
      <p>
        The App&apos;s code, design, and brand belong to us. The financial data you enter belongs
        to you.
      </p>

      <H2>8. Deleting your account</H2>
      <p>
        You can delete your account anytime from Profile → Delete account — this permanently and
        immediately erases your data. We may also suspend accounts that violate these terms.
      </p>

      <H2>9. Changes to these terms</H2>
      <p>If we make a material change to these terms, we&apos;ll let you know inside the App.</p>

      <H2>10. Governing law</H2>
      <p>These terms are governed by the laws of Costa Rica.</p>

      <H2>11. Contact</H2>
      <p>
        Jesús Rojas García —{" "}
        <a href="mailto:contacto@fineticap.com" className="text-navy-light hover:underline">
          contacto@fineticap.com
        </a>
      </p>
    </div>
  );
}
