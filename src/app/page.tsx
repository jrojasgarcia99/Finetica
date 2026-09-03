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
  try {
    const { data } = await supabase
      .from("personal_spaces")
      .select("nav_order")
      .eq("owner_id", user.id)
      .maybeSingle<{ nav_order: string[] | null }>();
    navOrder = data?.nav_order ?? null;
  } catch {
    /* columna aún no migrada: se usa el orden por defecto */
  }

  redirect(resolveNavItems(navOrder)[0]?.href ?? "/dashboard");
}
