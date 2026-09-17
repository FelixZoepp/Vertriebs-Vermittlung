import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

let configured = false;

function getWebPush(): typeof webpush | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;

  if (!configured) {
    webpush.setVapidDetails("mailto:noreply@zoeppmedia.de", publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Ziel-URL beim Klick auf die Benachrichtigung */
  url?: string;
}

interface SubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Push an alle Geräte der angegebenen User senden.
 * Fire-and-forget: Fehler werden geloggt, nie geworfen — Push darf
 * keinen Geschäftsprozess blockieren. Abgelaufene Subscriptions
 * (404/410) werden automatisch gelöscht.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  try {
    const wp = getWebPush();
    if (!wp || userIds.length === 0) return;

    const supabase = await createServiceClient();
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (!subs || subs.length === 0) return;

    const body = JSON.stringify(payload);
    const stale: number[] = [];

    await Promise.all(
      (subs as SubscriptionRow[]).map(async (sub) => {
        try {
          await wp.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body
          );
        } catch (e: unknown) {
          const statusCode = (e as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            stale.push(sub.id);
          } else {
            console.error("Push-Versand fehlgeschlagen:", e);
          }
        }
      })
    );

    if (stale.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", stale);
    }
  } catch (e) {
    console.error("sendPushToUsers fehlgeschlagen:", e);
  }
}

export async function sendPushToUser(
  userId: string | null | undefined,
  payload: PushPayload
): Promise<void> {
  if (!userId) return;
  await sendPushToUsers([userId], payload);
}

/** Push an alle Admin-Profile */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (!admins || admins.length === 0) return;
    await sendPushToUsers(
      admins.map((a: { id: string }) => a.id),
      payload
    );
  } catch (e) {
    console.error("sendPushToAdmins fehlgeschlagen:", e);
  }
}
