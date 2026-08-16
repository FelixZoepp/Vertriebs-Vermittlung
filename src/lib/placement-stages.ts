export const PLACEMENT_STAGES = [
  "vorgeschlagen",
  "erstgespraech",
  "vorstellungsgespraech",
  "probetag",
  "eingestellt",
  "abgelehnt",
] as const;

export type PlacementStage = (typeof PLACEMENT_STAGES)[number];

export const PLACEMENT_STAGE_LABELS: Record<PlacementStage, string> = {
  vorgeschlagen: "Vorgeschlagen",
  erstgespraech: "Erstgespräch",
  vorstellungsgespraech: "Vorstellungsgespräch",
  probetag: "Probetag",
  eingestellt: "Eingestellt",
  abgelehnt: "Abgelehnt",
};

export const PLACEMENT_STAGE_COLORS: Record<PlacementStage, string> = {
  vorgeschlagen: "bg-blue-100 text-blue-800",
  erstgespraech: "bg-amber-100 text-amber-800",
  vorstellungsgespraech: "bg-purple-100 text-purple-800",
  probetag: "bg-cyan-100 text-cyan-800",
  eingestellt: "bg-green-100 text-green-800",
  abgelehnt: "bg-red-100 text-red-800",
};

export const PLACEMENT_PIPELINE_STAGES: PlacementStage[] = [
  "vorgeschlagen",
  "erstgespraech",
  "vorstellungsgespraech",
  "probetag",
  "eingestellt",
];

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
