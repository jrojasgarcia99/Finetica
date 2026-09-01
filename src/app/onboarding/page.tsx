import { redirect } from "next/navigation";

/**
 * El onboarding con "crear hogar / unirme con código" ya no existe: cada cuenta
 * obtiene su espacio personal automáticamente (ver `getPersonalContext`). Esta
 * ruta se conserva solo para no romper enlaces viejos.
 */
export default function OnboardingPage() {
  redirect("/dashboard");
}
