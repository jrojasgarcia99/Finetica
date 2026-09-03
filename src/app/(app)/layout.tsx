import { redirect } from "next/navigation";
import { getPersonalContext } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { resolveNavItems } from "@/components/layout/nav-items";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { updateTipoCambio } from "@/app/(app)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, space, currency, locale } = await getPersonalContext();

  // Perfil incompleto → completar el alta antes de entrar a la app.
  if (!space.genero || !space.fecha_nacimiento) redirect("/onboarding");

  const nombre = space.display_name || "Mi espacio";
  const avatarUrl = space.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(space.avatar_path).data.publicUrl
    : null;

  return (
    <I18nProvider locale={locale}>
      <AppShell
        householdName={nombre}
        currency={currency}
        updateTipoCambio={updateTipoCambio}
        navOrder={resolveNavItems(space.nav_order).map((i) => i.href)}
        avatarUrl={avatarUrl}
      >
        {children}
      </AppShell>
    </I18nProvider>
  );
}
