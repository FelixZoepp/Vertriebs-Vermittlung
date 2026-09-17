"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { savePushSubscription } from "./actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

type Status =
  | "checking"
  | "unsupported"
  | "ios_needs_install"
  | "available"
  | "subscribed"
  | "denied"
  | "dismissed";

export function PushOptIn() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function check() {
      if (sessionStorage.getItem("push-optin-dismissed")) {
        setStatus("dismissed");
        return;
      }

      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        ("standalone" in navigator &&
          (navigator as { standalone?: boolean }).standalone === true);

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // iOS ohne Homescreen-Installation: Push erst nach "Zum Homescreen"
        setStatus(isIOS && !isStandalone ? "ios_needs_install" : "unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "available");
    }

    check().catch(() => setStatus("unsupported"));
  }, []);

  async function subscribe() {
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) return;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      const result = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });

      setStatus(result.success ? "subscribed" : "available");
    } catch {
      setStatus("available");
    } finally {
      setPending(false);
    }
  }

  function dismiss() {
    sessionStorage.setItem("push-optin-dismissed", "1");
    setStatus("dismissed");
  }

  if (
    status === "checking" ||
    status === "unsupported" ||
    status === "subscribed" ||
    status === "denied" ||
    status === "dismissed"
  ) {
    return null;
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Bell className="h-4 w-4 shrink-0 text-red-500" />
        <p className="text-sm text-muted-foreground">
          {status === "ios_needs_install"
            ? "Für Benachrichtigungen: Seite über „Teilen → Zum Home-Bildschirm\u201C installieren, dann hier aktivieren."
            : "Erhalte Push-Benachrichtigungen bei wichtigen Ereignissen."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status === "available" && (
          <button
            onClick={subscribe}
            disabled={pending}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Aktiviere…" : "Aktivieren"}
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Ausblenden"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
