/**
 * R4 – Rechnung bei Einstellung: 750€ netto, idempotent
 * R5 – Rechnung bei 100 Verträgen: 750€ netto, nur 1x, nur nach Admin-Bestätigung
 * R6 – Mahnlauf: Tag 3/10/17
 */

export const NETTO_CENT = 75000; // 750,00 €
export const UST_SATZ = 19;
export const ZAHLUNGSZIEL_TAGE = 14;
export const MEILENSTEIN_FRIST_MONATE = 3;
export const MEILENSTEIN_VERTRAEGE = 100;

export function berechneBrutto(nettoCent: number, ustSatz: number): number {
  return nettoCent + Math.round(nettoCent * ustSatz / 100);
}

export function berechneFaelligkeit(einstellungsDatum: Date, zahlungszielTage: number = ZAHLUNGSZIEL_TAGE): Date {
  const d = new Date(einstellungsDatum);
  d.setDate(d.getDate() + zahlungszielTage);
  return d;
}

export function berechneMeilensteinFrist(einstellungsDatum: Date): Date {
  const d = new Date(einstellungsDatum);
  d.setMonth(d.getMonth() + MEILENSTEIN_FRIST_MONATE);
  return d;
}

export function generiereRechnungsnummer(jahr: number, laufendeNr: number): string {
  return `ZM-${jahr}-${String(laufendeNr).padStart(4, "0")}`;
}

export type MahnStufe = "erinnerung" | "mahnung" | "eskalation" | null;

export function bestimmeMahnStufe(faelligAm: Date, heute: Date = new Date()): MahnStufe {
  const diffMs = heute.getTime() - faelligAm.getTime();
  const diffTage = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffTage >= 17) return "eskalation";
  if (diffTage >= 10) return "mahnung";
  if (diffTage >= 3) return "erinnerung";
  return null;
}

export function formatCent(cent: number): string {
  return (cent / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}
