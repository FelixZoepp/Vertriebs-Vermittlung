"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { STAGES, type Candidate, type Stage } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";

interface KanbanBoardProps {
  candidates: Candidate[];
}

export function KanbanBoard({ candidates: initialCandidates }: KanbanBoardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [dragStartStage, setDragStartStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const candidatesByStage = useMemo(() => {
    const grouped: Record<Stage, Candidate[]> = {} as Record<Stage, Candidate[]>;
    for (const stage of STAGES) {
      grouped[stage] = [];
    }
    for (const candidate of candidates) {
      if (grouped[candidate.stage]) {
        grouped[candidate.stage].push(candidate);
      }
    }
    return grouped;
  }, [candidates]);

  const findCandidateById = useCallback(
    (id: number): Candidate | undefined => {
      return candidates.find((c) => c.id === id);
    },
    [candidates]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const candidate = findCandidateById(event.active.id as number);
      if (candidate) {
        setActiveCandidate(candidate);
        setDragStartStage(candidate.stage);
      }
    },
    [findCandidateById]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as number;
      const activeData = active.data.current;
      const overData = over.data.current;

      // Determine target stage
      let targetStage: Stage | undefined;

      if (overData?.stage) {
        // Dropped over a column
        targetStage = overData.stage as Stage;
      } else if (overData?.candidate) {
        // Dropped over another card - use that card's stage
        targetStage = (overData.candidate as Candidate).stage;
      }

      if (!targetStage) return;

      const currentCandidate = activeData?.candidate as Candidate | undefined;
      if (!currentCandidate || currentCandidate.stage === targetStage) return;

      // Optimistic stage update during drag
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, stage: targetStage } : c
        )
      );
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const previousStage = dragStartStage;
      setActiveCandidate(null);
      setDragStartStage(null);

      if (!over || !previousStage) return;

      const activeId = active.id as number;
      const overData = over.data.current;

      // Determine target stage
      let targetStage: Stage | undefined;

      if (overData?.stage) {
        targetStage = overData.stage as Stage;
      } else if (overData?.candidate) {
        targetStage = (overData.candidate as Candidate).stage;
      }

      if (!targetStage) return;

      // No change -- drop back where it started
      if (targetStage === previousStage) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, stage: previousStage } : c
          )
        );
        return;
      }

      setError(null);

      try {
        const body: { stage: Stage; ablehnungsgrund?: string } = {
          stage: targetStage,
        };

        // If moving to abgelehnt, prompt for reason
        if (targetStage === "abgelehnt") {
          const reason = window.prompt("Ablehnungsgrund eingeben:");
          if (!reason) {
            // Revert if no reason given
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === activeId ? { ...c, stage: previousStage } : c
              )
            );
            return;
          }
          body.ablehnungsgrund = reason;
        }

        const res = await fetch(`/api/candidates/${activeId}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Stage-Update fehlgeschlagen");
        }

        const { candidate: updated } = await res.json();

        // Update with server response
        setCandidates((prev) =>
          prev.map((c) => (c.id === activeId ? updated : c))
        );
      } catch (err) {
        // Revert on error
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, stage: previousStage } : c
          )
        );
        setError(
          err instanceof Error ? err.message : "Stage-Update fehlgeschlagen"
        );
        setTimeout(() => setError(null), 5000);
      }
    },
    [dragStartStage]
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              candidates={candidatesByStage[stage]}
            />
          ))}

          <DragOverlay dropAnimation={null}>
            {activeCandidate ? (
              <KanbanCard candidate={activeCandidate} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
