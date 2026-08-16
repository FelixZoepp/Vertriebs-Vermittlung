"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updatePlacementStatus(
  placementId: number,
  newStatus: "interview" | "eingestellt" | "abgelehnt"
) {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Verify this placement belongs to the current partner
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Partner nicht gefunden." };
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "eingestellt") {
    updateData.eingestellt_am = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("placements")
    .update(updateData)
    .eq("id", placementId)
    .eq("partner_id", partner.id);

  if (error) {
    return { error: "Status konnte nicht aktualisiert werden." };
  }

  revalidatePath("/partner/kandidaten");
  return { success: true };
}

export async function expressInterest(placementId: number) {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Partner nicht gefunden." };
  }

  const { error } = await supabase
    .from("placements")
    .update({ status: "interview" })
    .eq("id", placementId)
    .eq("partner_id", partner.id)
    .eq("status", "vorgeschlagen");

  if (error) {
    return { error: "Interesse konnte nicht vermerkt werden." };
  }

  revalidatePath("/partner/kandidaten");
  return { success: true };
}
