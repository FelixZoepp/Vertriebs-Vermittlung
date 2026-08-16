export const PLACEMENT_STAGES = [
  "leadeingang",
  "vorstellungsgespraech",
  "probetag",
  "eingestellt",
  "abgelehnt",
] as const;

export type PlacementStage = (typeof PLACEMENT_STAGES)[number];

export const PLACEMENT_STAGE_LABELS: Record<PlacementStage, string> = {
  leadeingang: "Leadeingang",
  vorstellungsgespraech: "Vorstellungsgespräch",
  probetag: "Probetag",
  eingestellt: "Eingestellt",
  abgelehnt: "Abgelehnt",
};

export const PLACEMENT_STAGE_COLORS: Record<PlacementStage, string> = {
  leadeingang: "bg-blue-100 text-blue-800",
  vorstellungsgespraech: "bg-purple-100 text-purple-800",
  probetag: "bg-cyan-100 text-cyan-800",
  eingestellt: "bg-green-100 text-green-800",
  abgelehnt: "bg-red-100 text-red-800",
};

export const PLACEMENT_PIPELINE_STAGES: PlacementStage[] = [
  "leadeingang",
  "vorstellungsgespraech",
  "probetag",
  "eingestellt",
];

export const TRACKING_INTERVALS = [
  { key: "7_tage", label: "7 Tage", days: 7 },
  { key: "14_tage", label: "14 Tage", days: 14 },
  { key: "30_tage", label: "30 Tage", days: 30 },
  { key: "60_tage", label: "60 Tage", days: 60 },
  { key: "90_tage", label: "90 Tage", days: 90 },
] as const;

export function isValidPlacementTransition(
  from: PlacementStage,
  to: PlacementStage
): boolean {
  if (to === "abgelehnt") return true;
  const fromIdx = PLACEMENT_PIPELINE_STAGES.indexOf(from);
  const toIdx = PLACEMENT_PIPELINE_STAGES.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1 || toIdx === fromIdx - 1;
}
