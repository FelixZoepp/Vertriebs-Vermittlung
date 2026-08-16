"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/types";
import { changeStageAction } from "../_actions/change-stage";

interface StageChangerProps {
  candidateId: number;
  currentStage: Stage;
}

export function StageChanger({ candidateId, currentStage }: StageChangerProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStage = e.target.value as Stage;
    if (!newStage || newStage === currentStage) return;

    startTransition(async () => {
      const result = await changeStageAction(candidateId, currentStage, newStage);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        defaultValue=""
        onChange={handleChange}
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
      {isPending && (
        <span className="text-sm text-muted-foreground">Wird gespeichert...</span>
      )}
    </div>
  );
}
