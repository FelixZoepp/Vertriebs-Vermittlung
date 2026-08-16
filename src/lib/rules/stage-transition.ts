import type { Stage } from "@/lib/types";

/**
 * R1: When stage changes to 'qualifiziert', trigger masterclass unlock + account creation.
 * R2: Masterclass completion auto-transitions to 'vermittelbar'.
 * R3: 'vermittelbar' triggers matching.
 * General: Track stage_changed_at on every transition.
 */

const STAGE_ORDER: Stage[] = [
  "eingang",
  "qualifiziert",
  "masterclass_laeuft",
  "vermittelbar",
  "vermittelt",
  "abgelehnt",
];

export function isValidTransition(from: Stage, to: Stage): boolean {
  // Can always move to 'abgelehnt' from any stage
  if (to === "abgelehnt") return true;

  const fromIdx = STAGE_ORDER.indexOf(from);
  const toIdx = STAGE_ORDER.indexOf(to);

  // Allow forward movement (including skipping stages for admin)
  // and one step back for corrections
  return toIdx > fromIdx || toIdx === fromIdx - 1;
}

export function shouldUnlockMasterclass(newStage: Stage): boolean {
  return newStage === "qualifiziert";
}

export function shouldTriggerMatching(newStage: Stage): boolean {
  return newStage === "vermittelbar";
}

export function shouldCreateInvoice(newStage: Stage): boolean {
  return newStage === "vermittelt";
}

export function requiresRejectionReason(newStage: Stage): boolean {
  return newStage === "abgelehnt";
}
