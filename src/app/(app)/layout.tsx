import { getPersonalContext } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { resolveNavItems } from "@/components/layout/nav-items";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { updateTipoCambio } from "@/app/(app)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { space, currency, locale } = await getPersonalContext();
  const nombre = space.display_name || "Mi espacio";

  return (
    <I18nProvider locale={locale}>
      <AppShell
        householdName={nombre}
        memberName={nombre}
        currency={currency}
        updateTipoCambio={updateTipoCambio}
        navOrder={resolveNavItems(space.nav_order).map((i) => i.href)}
      >
        {children}
      </AppShell>
    </I18nProvider>
  );
}
