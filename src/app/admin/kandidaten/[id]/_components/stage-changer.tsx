"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/types";
import { changeStageAction } from "../_actions/change-stage";
import { Loader2, ArrowRightLeft } from "lucide-react";

interface StageChangerProps {
  candidateId: number;
  currentStage: Stage;
}

export function StageChanger({ candidateId, currentStage }: StageChangerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStage, setSelectedStage] = useState<Stage | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter();

  const showRejectionField = selectedStage === "abgelehnt";

  function handleSubmit() {
    if (!selectedStage || selectedStage === currentStage) return;

    startTransition(async () => {
      const result = await changeStageAction(
        candidateId,
        currentStage,
        selectedStage,
        showRejectionField ? rejectionReason : undefined
      );
      if (result?.error) {
        alert(result.error);
      } else {
        setSelectedStage("");
        setRejectionReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value as Stage)}
          disabled={isPending}
          className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          <option value="" disabled>
            Neuen Stage waehlen...
          </option>
          {STAGES.filter((s) => s !== currentStage).map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedStage}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="size-4" />
          )}
          {isPending ? "Wird gespeichert..." : "Stage aendern"}
        </Button>
      </div>

      {showRejectionField && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Ablehnungsgrund (erforderlich)
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Grund fuer die Ablehnung eingeben..."
            className="max-w-md"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
