"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Candidate, Stage } from "@/lib/types";

function getStageBorderColor(stage: Stage): string {
  switch (stage) {
    case "eingang":
    case "kontaktiert":
      return "border-l-gray-400";
    case "erstgespraech":
    case "qualifiziert":
      return "border-l-blue-500";
    case "masterclass_laeuft":
    case "masterclass_abgeschlossen":
      return "border-l-purple-500";
    case "vorgestellt":
    case "interview":
      return "border-l-amber-500";
    case "eingestellt":
      return "border-l-green-500";
    case "abgelehnt":
      return "border-l-red-500";
    default:
      return "border-l-gray-400";
  }
}

function getQuelleBadgeVariant(
  quelle: Candidate["quelle"]
): "default" | "secondary" | "outline" {
  switch (quelle) {
    case "reel":
      return "default";
    case "empfehlung":
      return "secondary";
    default:
      return "outline";
  }
}

function getDaysInStage(stageChangedAt: string): number {
  const changed = new Date(stageChangedAt);
  const now = new Date();
  const diffMs = now.getTime() - changed.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

interface KanbanCardProps {
  candidate: Candidate;
  isDragOverlay?: boolean;
}

export function KanbanCard({ candidate, isDragOverlay }: KanbanCardProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: { candidate },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const daysInStage = getDaysInStage(candidate.stage_changed_at);
  const isStale = daysInStage >= 7;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={(e) => {
        // Don't navigate when dragging
        if (isDragging) return;
        e.stopPropagation();
        router.push(`/admin/kandidaten/${candidate.id}`);
      }}
      className={cn(
        "cursor-grab rounded-lg border border-l-4 bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        getStageBorderColor(candidate.stage),
        isDragging && "opacity-50",
        isDragOverlay && "rotate-2 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-tight">
          {candidate.vorname} {candidate.nachname}
        </p>
        {isStale && (
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
            title={`${daysInStage} Tage in dieser Phase`}
          />
        )}
      </div>

      {(candidate.plz || candidate.ort) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {candidate.plz} {candidate.ort}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge variant={getQuelleBadgeVariant(candidate.quelle)} className="text-[10px] px-1.5 py-0">
          {candidate.quelle}
        </Badge>
        <span
          className={cn(
            "text-xs tabular-nums",
            isStale ? "font-medium text-red-600" : "text-muted-foreground"
          )}
        >
          {daysInStage}d
        </span>
      </div>
    </div>
  );
}
