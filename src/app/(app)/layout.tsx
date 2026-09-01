import { getHouseholdContext } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { household, member } = await getHouseholdContext();

  return (
    <AppShell householdName={household.name} memberName={member.display_name}>
      {children}
    </AppShell>
  );
}
