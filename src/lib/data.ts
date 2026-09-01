import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Household, HouseholdMember } from "@/lib/types";

export async function getHouseholdContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("household_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<HouseholdMember>();

  if (!member) redirect("/onboarding");

  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", member.household_id)
    .single<Household>();

  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", member.household_id)
    .order("created_at", { ascending: true });

  return {
    supabase,
    user,
    member,
    household: household as Household,
    members: (members ?? []) as HouseholdMember[],
  };
}
