import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveNavItems } from "@/components/layout/nav-items";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: space } = await supabase
    .from("personal_spaces")
    .select("nav_order")
    .eq("owner_id", user.id)
    .maybeSingle<{ nav_order: string[] | null }>();

  redirect(resolveNavItems(space?.nav_order)[0]?.href ?? "/dashboard");
}
