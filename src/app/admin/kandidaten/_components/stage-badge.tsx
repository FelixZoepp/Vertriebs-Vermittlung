import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

function getStageBadgeClassName(stage: Stage): string {
  switch (stage) {
    case "eingang":
    case "kontaktiert":
      return "";
    case "erstgespraech":
    case "qualifiziert":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "masterclass_laeuft":
    case "masterclass_abgeschlossen":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300";
    case "vorgestellt":
    case "interview":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
    case "eingestellt":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300";
    case "abgelehnt":
      return "";
    default:
      return "";
  }
}

export function StageBadge({ stage }: { stage: Stage }) {
  const isAbgelehnt = stage === "abgelehnt";

  return (
    <Badge
      variant={isAbgelehnt ? "destructive" : "outline"}
      className={cn(!isAbgelehnt && getStageBadgeClassName(stage))}
    >
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
