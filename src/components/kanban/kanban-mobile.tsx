"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS, type Candidate, type Stage } from "@/lib/types";
import { isValidTransition } from "@/lib/rules/stage-transition";
import { ArrowRightLeft } from "lucide-react";

function getStageBorderColor(stage: Stage): string {
  switch (stage) {
    case "eingang":
      return "border-l-gray-400";
    case "qualifiziert":
      return "border-l-blue-500";
    case "masterclass_laeuft":
      return "border-l-purple-500";
    case "vermittelbar":
      return "border-l-amber-500";
    case "vermittelt":
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
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24));
}

interface KanbanMobileProps {
  candidatesByStage: Record<Stage, Candidate[]>;
  onStageChange: (candidate: Candidate, targetStage: Stage) => void;
}

export function KanbanMobile({
  candidatesByStage,
  onStageChange,
}: KanbanMobileProps) {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<Stage>("eingang");

  const candidates = candidatesByStage[selectedStage];

  return (
    <div className="flex flex-col gap-4 md:hidden">
      {/* Stage-Tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {STAGES.map((stage) => {
          const count = candidatesByStage[stage].length;
          const isActive = stage === selectedStage;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                isActive
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {STAGE_LABELS[stage]}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  isActive ? "bg-white/20" : "bg-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Karten der gewählten Phase */}
      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Keine Kandidaten in dieser Phase
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates.map((candidate) => {
            const daysInStage = getDaysInStage(candidate.stage_changed_at);
            const isStale = daysInStage >= 7;
            const targetStages = STAGES.filter(
              (s) =>
                s !== candidate.stage && isValidTransition(candidate.stage, s)
            );

            return (
              <div
                key={candidate.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-l-4 bg-card p-3 text-sm shadow-sm",
                  getStageBorderColor(candidate.stage)
                )}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    router.push(`/admin/kandidaten/${candidate.id}`)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium leading-tight">
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
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={getQuelleBadgeVariant(candidate.quelle)}
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {candidate.quelle}
                    </Badge>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        isStale
                          ? "font-medium text-red-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {daysInStage}d
                    </span>
                  </div>
                </button>

                {targetStages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Phase ändern"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors active:bg-muted"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {targetStages.map((stage) => (
                        <DropdownMenuItem
                          key={stage}
                          className={cn(
                            "min-h-11",
                            stage === "abgelehnt" && "text-red-600"
                          )}
                          onClick={() => onStageChange(candidate, stage)}
                        >
                          {STAGE_LABELS[stage]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
