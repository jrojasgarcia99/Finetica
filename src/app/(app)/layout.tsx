import { getPersonalContext } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { updateTipoCambio } from "@/app/(app)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { space, currency } = await getPersonalContext();
  const nombre = space.display_name || "Mi espacio";

  return (
    <AppShell
      householdName={nombre}
      memberName={nombre}
      currency={currency}
      updateTipoCambio={updateTipoCambio}
    >
      {children}
    </AppShell>
  );
}
