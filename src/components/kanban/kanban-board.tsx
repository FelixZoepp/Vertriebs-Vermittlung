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
import { KanbanMobile } from "./kanban-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface KanbanBoardProps {
  candidates: Candidate[];
}

interface RejectState {
  candidateId: number;
  candidateName: string;
  previousStage: Stage;
}

export function KanbanBoard({ candidates: initialCandidates }: KanbanBoardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [dragStartStage, setDragStartStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectState, setRejectState] = useState<RejectState | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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

  const revertCandidate = useCallback((candidateId: number, stage: Stage) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage } : c))
    );
  }, []);

  /** Gemeinsame Stage-Änderung: optimistisches Update + PATCH + Revert bei Fehler. */
  const performStageChange = useCallback(
    async (
      candidateId: number,
      targetStage: Stage,
      previousStage: Stage,
      ablehnungsgrund?: string
    ) => {
      setError(null);
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, stage: targetStage } : c
        )
      );

      try {
        const body: { stage: Stage; ablehnungsgrund?: string } = {
          stage: targetStage,
        };
        if (ablehnungsgrund) {
          body.ablehnungsgrund = ablehnungsgrund;
        }

        const res = await fetch(`/api/candidates/${candidateId}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Stage-Update fehlgeschlagen");
        }

        const { candidate: updated } = await res.json();
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? updated : c))
        );
      } catch (err) {
        revertCandidate(candidateId, previousStage);
        setError(
          err instanceof Error ? err.message : "Stage-Update fehlgeschlagen"
        );
        setTimeout(() => setError(null), 5000);
      }
    },
    [revertCandidate]
  );

  /** Öffnet den Ablehnungs-Dialog (statt window.prompt). */
  const openRejectDialog = useCallback(
    (candidate: Candidate, previousStage: Stage) => {
      setRejectReason("");
      setRejectState({
        candidateId: candidate.id,
        candidateName: `${candidate.vorname} ${candidate.nachname}`,
        previousStage,
      });
    },
    []
  );

  const confirmReject = useCallback(() => {
    if (!rejectState || !rejectReason.trim()) return;
    performStageChange(
      rejectState.candidateId,
      "abgelehnt",
      rejectState.previousStage,
      rejectReason.trim()
    );
    setRejectState(null);
  }, [rejectState, rejectReason, performStageChange]);

  const cancelReject = useCallback(() => {
    if (rejectState) {
      // Falls per Drag schon optimistisch verschoben: zurücksetzen
      revertCandidate(rejectState.candidateId, rejectState.previousStage);
    }
    setRejectState(null);
  }, [rejectState, revertCandidate]);

  /** Stage-Wechsel aus der Mobilansicht (Dropdown-Menü). */
  const handleMobileStageChange = useCallback(
    (candidate: Candidate, targetStage: Stage) => {
      if (targetStage === "abgelehnt") {
        openRejectDialog(candidate, candidate.stage);
        return;
      }
      performStageChange(candidate.id, targetStage, candidate.stage);
    },
    [openRejectDialog, performStageChange]
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
    (event: DragEndEvent) => {
      const { active, over } = event;
      const previousStage = dragStartStage;
      const draggedCandidate = activeCandidate;
      setActiveCandidate(null);
      setDragStartStage(null);

      if (!over || !previousStage || !draggedCandidate) return;

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
        revertCandidate(activeId, previousStage);
        return;
      }

      // Ablehnung: Grund per Dialog erfassen (Karte bleibt optimistisch liegen)
      if (targetStage === "abgelehnt") {
        openRejectDialog(draggedCandidate, previousStage);
        return;
      }

      performStageChange(activeId, targetStage, previousStage);
    },
    [
      dragStartStage,
      activeCandidate,
      revertCandidate,
      openRejectDialog,
      performStageChange,
    ]
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Mobil: Stage-Tabs + Kartenliste */}
      <KanbanMobile
        candidatesByStage={candidatesByStage}
        onStageChange={handleMobileStageChange}
      />

      {/* Desktop: Drag-and-Drop-Board */}
      <div className="hidden gap-3 overflow-x-auto pb-4 md:flex">
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

      {/* Ablehnungs-Dialog */}
      {rejectState && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={cancelReject}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold">Kandidat ablehnen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {rejectState.candidateName} wird auf „Abgelehnt" gesetzt. Bitte
              Grund angeben:
            </p>
            <Textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ablehnungsgrund…"
              className="mt-3 min-h-24"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={cancelReject}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectReason.trim()}
                onClick={confirmReject}
              >
                Ablehnen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
