"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, type Candidate, type Stage } from "@/lib/types";
import { KanbanCard } from "./kanban-card";

function getColumnHeaderColor(stage: Stage): string {
  switch (stage) {
    case "eingang":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "qualifiziert":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "masterclass_laeuft":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    case "vermittelbar":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
    case "vermittelt":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "abgelehnt":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

interface KanbanColumnProps {
  stage: Stage;
  candidates: Candidate[];
}

export function KanbanColumn({ stage, candidates }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  const candidateIds = candidates.map((c) => c.id);

  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg border bg-muted/30">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-lg px-3 py-2",
          getColumnHeaderColor(stage)
        )}
      >
        <span className="text-xs font-semibold truncate">
          {STAGE_LABELS[stage]}
        </span>
        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
          {candidates.length}
        </Badge>
      </div>

      {/* Drop zone */}
      <SortableContext
        items={candidateIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
            isOver && "bg-accent/50"
          )}
          style={{ minHeight: 120 }}
        >
          {candidates.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-4">
              <p className="text-xs text-muted-foreground">Keine Kandidaten</p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <KanbanCard key={candidate.id} candidate={candidate} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
