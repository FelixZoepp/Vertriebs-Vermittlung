# Vertriebs-Vermittlung – Claude Code Kontext

## Produkt
Zoepp Media Vertriebsvermittlung: CRM-Plattform für D2D-Vertriebler-Vermittlung an Partnerunternehmen.
Zweistufige Abrechnung: 750€ netto bei Einstellung + 750€ netto bei 100 Verträgen (3-Monats-Frist).
Volumen: 50–100 Partner, 80–100 Bewerber/Monat. Voll durchautomatisiert.

## Stack
Next.js 15 (App Router), TypeScript, Tailwind + shadcn/ui, Supabase (Postgres + RLS + Auth), Stripe (SEPA), Resend, Vercel, dnd-kit (Kanban).

## Firma
Content-Leads Solutions UG, Rhinstraße 137A, 10315 Berlin

## Architektur-Regeln
- Geschäftslogik ausschließlich in `/lib/rules/`, jede Regel mit Unit-Tests (Vitest)
- Beträge IMMER in Cent als Integer, nie als Float
- Alle Geldregeln idempotent: Statuswechsel kann mehrfach ausgelöst werden, Rechnungen dürfen es nicht
- Migrationen als SQL-Files in `/supabase/migrations/`, jede Tabelle mit RLS-Policy im selben Commit
- Deutsche Feldbezeichnungen im UI, englische im Code
- Kein Kandidatenklarname im Partner-Frontend vor `placements.status != vorgeschlagen`
- Vor jedem neuen Feature: bestehende Regeln in `/lib/rules/` lesen
- Externe Dienste (Stripe, Resend) hinter Adaptern in `/lib/integrations/`
- Tailwind v4: `@import "tailwindcss" theme(static);` in globals.css

## Drei Rollen
- `admin` – Zoepp Media, sieht alles
- `partner` – Partnerunternehmen, sieht nur eigene Kandidaten/Rechnungen
- `candidate` – Vertriebler, sieht eigenes Profil + Masterclass

## Kanban-Spalten (exakte Reihenfolge)
1. Eingang → 2. Kontaktiert → 3. Erstgespräch → 4. Qualifiziert (→ Masterclass) → 5. Masterclass läuft → 6. Masterclass abgeschlossen (→ Matching) → 7. Vorgestellt → 8. Interview → 9. Eingestellt (→ Rechnung) → 10. Abgelehnt/Verloren

## Geschäftsregeln (in `/lib/rules/`)
- R1: Stage→Qualifiziert → Masterclass-Mail mit Magic Link
- R2: Heartbeat 15s, Pflichtmodule ≥95% → Stage 6 auto
- R3: Stage 6 → Matching-Score (Distanz 50%, Branche 30%, Erfahrung 10%, Kapazität 10%), Top-3, Admin gibt frei
- R4: placement.status=eingestellt → Rechnung 750€, SEPA, idempotent
- R5: contract_reports ≥100 → Rechnung 750€, nur 1x, nur nach Admin-Bestätigung, Frist 3 Monate
- R6: Mahnlauf Tag 3/10/17, SEPA-Rücklastschrift → Alert
