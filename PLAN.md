# Zoepp Media – Vertriebsvermittlung

## Projektplan & Build-Spezifikation

---

## 1. Systemkontext

Zoepp Media gewinnt über Social Media (Reels) Vertriebler als Leads, qualifiziert sie, schaltet ihnen bei Erreichen definierter Kriterien eine Masterclass frei, prüft die Ansicht und vermittelt sie anschließend standortbasiert an Partnerunternehmen. Partner arbeiten in einer gemeinsamen Cloud-Oberfläche mit Zoepp Media. Abgerechnet wird zweistufig: **750 € netto bei Einstellung** und **750 € netto bei 100 abgeschlossenen Verträgen** des vermittelten Vertrieblers. Das gesamte System ist ein eigenes CRM.

**D2D-Markt:** Vertriebler schreiben Verträge an der Haustür. Frist für die 100 Verträge: **3 Monate**. Kündigt der Vertriebler vor Erreichen der 100, entfällt die zweite Zahlung.

**Erwartetes Volumen:** 50–100 Partner, 80–100 Bewerber/Monat → System muss von Tag 1 voll durchautomatisiert sein.

**Drei Nutzerrollen:**

| Rolle | Sieht | Kann |
|---|---|---|
| `admin` (Zoepp Media) | Alles | Leads, Partner, Matching, Rechnungen, Content |
| `partner` (Unternehmen) | Nur eigene vorgeschlagene Kandidaten + eigene Rechnungen | Status melden, Kandidat annehmen/ablehnen, Vertragszahlen melden |
| `candidate` (Vertriebler) | Eigenes Profil + Masterclass | Profil vervollständigen, Masterclass schauen |

---

## 2. Tech-Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Datenbank/Auth/Storage:** Supabase (Postgres, RLS, Auth, Storage)
- **UI:** Tailwind + shadcn/ui, Kanban via `dnd-kit`
- **Hosting:** Vercel
- **Billing:** Stripe Invoicing + SEPA-Lastschrift
- **E-Mail:** Resend mit React Email Templates
- **Geodaten:** PLZ→Koordinaten lokal in Postgres, Distanz per Haversine-SQL
- **Masterclass:** Google Drive Videos, Links in der Plattform gespiegelt

---

## 3. Datenmodell

```
partners
  id, firmenname, ansprechpartner, email, telefon
  strasse, plz, ort, lat, lng, suchradius_km
  branche, gesuchte_profile[], offene_stellen (int)
  status: interessent | aktiv | pausiert | gekündigt
  stripe_customer_id, sepa_mandat_ref, sepa_mandat_datum
  vertrag_unterschrieben_am, created_at

candidates
  id, vorname, nachname, email, telefon
  plz, ort, lat, lng, umkreis_bereitschaft_km
  erfahrung_jahre, branchenerfahrung[], fuehrerschein (bool), verfuegbar_ab
  quelle: reel | organisch | empfehlung | anzeige, quelle_detail
  stage, stage_changed_at
  masterclass_freigeschaltet_am, masterclass_abgeschlossen_am
  ablehnungsgrund, owner_id, created_at

placements
  id, candidate_id, partner_id
  match_score (0-100), status: vorgeschlagen | interview | eingestellt | abgelehnt | abgebrochen
  vorgeschlagen_am, eingestellt_am, abgelehnt_grund
  vertraege_gesamt (int), meilenstein_frist (3 Monate ab Einstellung)
  meilenstein_100_erreicht_am

contract_reports
  id, placement_id, zeitraum_monat, anzahl_vertraege, gemeldet_von, gemeldet_am, bestaetigt_von_admin

invoices
  id, partner_id, placement_id
  typ: einstellung | meilenstein_100
  netto (75000 cent), ust_satz, brutto, rechnungsnummer
  status: entwurf | versendet | eingezogen | bezahlt | fehlgeschlagen | storniert
  faellig_am, bezahlt_am, stripe_invoice_id, pdf_url

masterclass_modules
  id, titel, reihenfolge, video_url (Google Drive Link), dauer_sek, pflicht (bool)

masterclass_progress
  id, candidate_id, module_id, sekunden_gesehen, abgeschlossen (bool), zuletzt_am

content_items
  id, hook, thema, skript, plattform[], status: idee | skript | dreh | schnitt | geplant | live
  geplant_fuer, veroeffentlicht_am, views, leads_zugeordnet (int), verantwortlich

activity_log
  id, entity_typ, entity_id, aktion, akteur_id, payload (jsonb), created_at
```

---

## 4. Kanban-Spalten

1. Eingang
2. Kontaktiert
3. Erstgespräch
4. Qualifiziert → löst Masterclass-Freischaltung aus
5. Masterclass läuft
6. Masterclass abgeschlossen → Matching-Pool
7. Vorgestellt
8. Interview
9. Eingestellt → löst Rechnung 1 aus
10. Abgelehnt / Verloren (Pflichtfeld Grund)

---

## 5. Geschäftsregeln

**R1 – Masterclass-Freischaltung:** Stage → Qualifiziert → Mail mit Magic Link.
**R2 – Ansichtskontrolle:** Heartbeat alle 15 Sek., alle Pflichtmodule ≥ 95 % → Stage 6 automatisch.
**R3 – Matching:** Stage 6 → Score (Distanz 50 %, Branche 30 %, Erfahrung 10 %, Kapazität 10 %). Top-3 Vorschlag, Admin gibt frei.
**R4 – Rechnung Einstellung:** placement.status = eingestellt → 750 € netto, SEPA, idempotent.
**R5 – Rechnung 100 Verträge:** Summe contract_reports ≥ 100 → 750 € netto. Frist: 3 Monate ab Einstellung. Nur nach Admin-Bestätigung.
**R6 – Mahnlauf:** Tag 3 Erinnerung, Tag 10 Mahnung, Tag 17 Eskalation. SEPA-Rücklastschrift → sofort Alert.

---

## 6. Umsetzungsphasen

| Phase | Inhalt | Fertig, wenn |
|---|---|---|
| **0 – Fundament** | Next.js + Supabase + Vercel, Auth mit 3 Rollen, RLS, Layout | Login funktioniert, Rollen sehen unterschiedliche Startseiten |
| **1 – CRM-Kern** | candidates, partners, activity_log, CRUD, Lead-Formular | Lead kommt per Formular rein |
| **2 – Kanban** | Board, Drag & Drop, Stage-Historie, Filter | Leads durchlaufen alle 10 Spalten |
| **3 – Masterclass** | Module, Video-Player, Fortschritt, R1 + R2 | Freischaltung und Abschluss automatisch |
| **4 – Matching** | PLZ-Geodaten, Score, Vorschläge, R3 | Top-3 mit Score |
| **5 – Partnerportal** | partner-Rolle, Vorschläge, Status, Verträge | Partner meldet Einstellung |
| **6 – Billing** | Stripe/SEPA, Rechnungen, R4 + R5 + R6, PDF | Einstellung → Rechnung → Einzug |
| **7 – Content** | Reel-Board, Kalender, Attribution | Reel-ID am Lead |
| **8 – Dashboard** | KPIs, E-Mail-Templates, Rechte-Audit | Kennzahlen korrekt |

**Schnellstart-Reihenfolge:** 0 → 1 → 2 → 5 → 6 → 3 → 4 → 7 → 8
