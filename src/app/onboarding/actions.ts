"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHousehold(formData: FormData) {
  const hhName = String(formData.get("hh_name") || "").trim();
  const memberName = String(formData.get("member_name") || "").trim();

  if (!hhName || !memberName) {
    redirect(`/onboarding?error=${encodeURIComponent("Completa ambos campos.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    hh_name: hhName,
    member_name: memberName,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function joinHousehold(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const memberName = String(formData.get("member_name") || "").trim();

  if (!code || !memberName) {
    redirect(`/onboarding?error=${encodeURIComponent("Completa ambos campos.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", {
    code,
    member_name: memberName,
  });

  if (error) {
    const msg =
      error.message === "INVALID_CODE"
        ? "Ese código de invitación no existe. Verifícalo con quien te lo compartió."
        : error.message;
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`);
  }
  redirect("/dashboard");
}
