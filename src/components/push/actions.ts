"use server";

import { getAuthUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function savePushSubscription(
  sub: PushSubscriptionInput
): Promise<{ success: boolean }> {
  const user = await getAuthUser();

  if (!sub.endpoint || !sub.p256dh || !sub.auth) {
    return { success: false };
  }

  const supabase = await createServiceClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" }
  );

  return { success: !error };
}

export async function deletePushSubscription(
  endpoint: string
): Promise<{ success: boolean }> {
  const user = await getAuthUser();

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  return { success: !error };
}
