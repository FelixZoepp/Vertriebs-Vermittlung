# PWA + Push-Benachrichtigungen — Design

Datum: 2026-09-17 · Status: freigegeben

## Ziel
Die bestehende Web-App wird als PWA installierbar (Homescreen, standalone) und
verschickt Web-Push-Benachrichtigungen an alle drei Rollen. Kein externer
Push-Dienst — natives Web Push (VAPID) mit dem `web-push`-Paket.

## Push-Events
| Event | Auslöseort | Empfänger |
|---|---|---|
| Neuer Bewerber | `/bewerben`-Action + `/api/webhooks/leads` | alle Admins |
| Kandidat vorgeschlagen | Placement-Erstellung (Matching/R8) | Partner |
| Kandidat anderweitig vergeben | R7 (`competing-placements`) | Partner |
| Masterclass freigeschaltet | R1 (`stage-transition`) | Kandidat |
| Beim Partner vorgestellt | Placement-Status → vorgestellt | Kandidat |

## Komponenten
1. **Manifest**: `src/app/manifest.ts` (Next-nativ), Icons 192/512 in `public/`,
   `display: standalone`. Root-Layout: `appleWebApp`-Metadata.
2. **Service Worker**: `public/sw.js` — `push`-Event → `showNotification`,
   `notificationclick` → `clients.openWindow(data.url)`.
3. **DB**: Migration `006_push_subscriptions.sql` — Tabelle `push_subscriptions`
   (`id`, `user_id → auth.users`, `endpoint` unique, `p256dh`, `auth`,
   `created_at`) + RLS (User nur eigene Zeilen). Mehrere Geräte pro User möglich.
4. **Adapter**: `src/lib/integrations/push.ts` —
   `sendPushToUser(userId, payload)`, `sendPushToAdmins(payload)`.
   `web-push` + VAPID. Fire-and-forget: Fehler werden geschluckt/geloggt,
   blockieren nie einen Geschäftsprozess. HTTP 404/410 → Subscription löschen.
5. **Client**: `src/components/push/push-opt-in.tsx` — Button
   „Benachrichtigungen aktivieren" in Admin-/Partner-/Kandidat-Layout.
   Registriert SW, holt Permission (nur nach User-Geste), speichert Subscription
   per Server Action. iOS ohne Standalone-Modus → Hinweis „Zum Homescreen
   hinzufügen". Verschwindet, wenn bereits abonniert.
6. **Env**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (lokal +
   Vercel). Subject: `mailto:noreply@zoeppmedia.de`.

## Nicht-Ziele
- Kein Notification-Center / keine Historie in der App
- Keine E-Mail-Ablösung — Push ergänzt Resend-Mails nur
- Kein App-Store-Release

## Teststrategie
Kein Vitest-Setup im Repo vorhanden; Verifikation über Build + manuellen
End-to-End-Test (Handy: installieren → aktivieren → Test-Bewerbung → Push).
