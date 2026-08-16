export interface Partner {
  id: number;
  user_id: string | null;
  firmenname: string;
  ansprechpartner: string;
  email: string;
  telefon: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  lat: number | null;
  lng: number | null;
  suchradius_km: number;
  branche: string | null;
  gesuchte_profile: string[];
  offene_stellen: number;
  status: "interessent" | "aktiv" | "pausiert" | "gekuendigt";
  stripe_customer_id: string | null;
  sepa_mandat_ref: string | null;
  sepa_mandat_datum: string | null;
  vertrag_unterschrieben_am: string | null;
  created_at: string;
}

export const STAGES = [
  "eingang",
  "qualifiziert",
  "masterclass_laeuft",
  "vermittelbar",
  "vermittelt",
  "abgelehnt",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  eingang: "Leadeingang",
  qualifiziert: "Qualifiziert",
  masterclass_laeuft: "Masterclass läuft",
  vermittelbar: "Vermittelfähig",
  vermittelt: "Vermittelt",
  abgelehnt: "Abgelehnt",
};

export interface Candidate {
  id: number;
  user_id: string | null;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string | null;
  plz: string | null;
  ort: string | null;
  lat: number | null;
  lng: number | null;
  umkreis_bereitschaft_km: number;
  erfahrung_jahre: number;
  branchenerfahrung: string[];
  fuehrerschein: boolean;
  verfuegbar_ab: string | null;
  quelle: "reel" | "organisch" | "empfehlung" | "anzeige";
  quelle_detail: string | null;
  stage: Stage;
  stage_changed_at: string;
  masterclass_freigeschaltet_am: string | null;
  masterclass_abgeschlossen_am: string | null;
  ablehnungsgrund: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface Placement {
  id: number;
  candidate_id: number;
  partner_id: number;
  match_score: number | null;
  status: "leadeingang" | "vorstellungsgespraech" | "probetag" | "eingestellt" | "abgelehnt" | "abgebrochen";
  vorgeschlagen_am: string;
  eingestellt_am: string | null;
  abgelehnt_grund: string | null;
  vertraege_gesamt: number;
  meilenstein_frist: string | null;
  meilenstein_100_erreicht_am: string | null;
  created_at: string;
  // Joined
  candidate?: Candidate;
  partner?: Partner;
}

export interface ContractReport {
  id: number;
  placement_id: number;
  zeitraum_monat: string;
  anzahl_vertraege: number;
  gemeldet_von: string;
  gemeldet_am: string;
  bestaetigt_von_admin: string | null;
}

export interface Invoice {
  id: number;
  partner_id: number;
  placement_id: number;
  typ: "einstellung" | "meilenstein_100";
  netto_cent: number;
  ust_satz: number;
  brutto_cent: number;
  rechnungsnummer: string | null;
  status: "entwurf" | "versendet" | "eingezogen" | "bezahlt" | "fehlgeschlagen" | "storniert";
  faellig_am: string | null;
  bezahlt_am: string | null;
  stripe_invoice_id: string | null;
  pdf_url: string | null;
  created_at: string;
  // Joined
  partner?: Partner;
  placement?: Placement;
}

export interface ContentItem {
  id: number;
  hook: string | null;
  thema: string;
  skript: string | null;
  plattform: string[];
  status: "idee" | "skript" | "dreh" | "schnitt" | "geplant" | "live";
  geplant_fuer: string | null;
  veroeffentlicht_am: string | null;
  views: number;
  leads_zugeordnet: number;
  verantwortlich: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  entity_typ: string;
  entity_id: number;
  aktion: string;
  akteur_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface MasterclassModule {
  id: number;
  titel: string;
  reihenfolge: number;
  video_url: string;
  dauer_sek: number;
  pflicht: boolean;
  created_at: string;
}

export interface MasterclassProgress {
  id: number;
  candidate_id: number;
  module_id: number;
  sekunden_gesehen: number;
  abgeschlossen: boolean;
  zuletzt_am: string;
}

export interface Note {
  id: number;
  entity_typ: string;
  entity_id: number;
  inhalt: string;
  autor_id: string | null;
  created_at: string;
}
