"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitTrackingReport } from "@/app/tracking/[id]/_actions";
import { useRouter } from "next/navigation";

interface InlineTrackingFormProps {
  trackingId: number;
}

export function InlineTrackingForm({ trackingId }: InlineTrackingFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const anzahl = parseInt(formData.get("anzahl") as string, 10);
    if (isNaN(anzahl) || anzahl < 0) {
      setError("Ungueltige Zahl");
      setPending(false);
      return;
    }

    const result = await submitTrackingReport(trackingId, anzahl);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setDone(true);
    setPending(false);
    router.refresh();
  }

  if (done) {
    return (
      <span className="text-xs text-green-600 font-medium">Gemeldet!</span>
    );
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-1.5">
      <Input
        name="anzahl"
        type="number"
        min={0}
        required
        placeholder="0"
        className="h-7 w-16 text-xs"
      />
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="h-7 px-2 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
      >
        {pending ? "..." : "OK"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
