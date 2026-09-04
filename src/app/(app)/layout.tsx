import { redirect } from "next/navigation";
import { getPersonalContext } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { PaletteBoot } from "@/components/layout/PaletteBoot";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { resolveNavItems } from "@/components/layout/nav-items";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { normalizeTema } from "@/lib/theme";
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
      <PaletteBoot palette={normalizeTema(space.tema)} />
      <AppShell
        householdName={nombre}
        currency={currency}
        updateTipoCambio={updateTipoCambio}
        navOrder={resolveNavItems(space.nav_order).map((i) => i.href)}
        avatarUrl={avatarUrl}
      >
        {children}
      </AppShell>
      <AssistantWidget enabled={Boolean(process.env.OPENAI_API_KEY)} />
    </I18nProvider>
  );
}
