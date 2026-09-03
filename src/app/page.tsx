import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveNavItems } from "@/components/layout/nav-items";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let navOrder: string[] | null = null;
  let incompleto = false;
  try {
    const { data } = await supabase
      .from("personal_spaces")
      .select("nav_order, genero, fecha_nacimiento")
      .eq("owner_id", user.id)
      .maybeSingle<{
        nav_order: string[] | null;
        genero: string | null;
        fecha_nacimiento: string | null;
      }>();
    navOrder = data?.nav_order ?? null;
    // Sin fila (cuenta nueva) o sin datos de perfil ⇒ onboarding.
    incompleto = !data || !data.genero || !data.fecha_nacimiento;
  } catch {
    incompleto = true; // ante la duda, al onboarding (su guarda re-verifica)
  }

  if (incompleto) redirect("/onboarding");
  redirect(resolveNavItems(navOrder)[0]?.href ?? "/dashboard");
}
