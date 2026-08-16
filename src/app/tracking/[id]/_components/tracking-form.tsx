"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitTrackingReport } from "../_actions";

interface TrackingFormProps {
  trackingId: number;
  kandidatName: string;
}

export function TrackingForm({ trackingId, kandidatName }: TrackingFormProps) {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const anzahl = parseInt(formData.get("anzahl_vertraege") as string, 10);

    if (isNaN(anzahl) || anzahl < 0) {
      setError("Bitte gib eine gueltige Anzahl ein.");
      setPending(false);
      return;
    }

    const result = await submitTrackingReport(trackingId, anzahl);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setTotal(result.total ?? null);
    setSubmitted(true);
    setPending(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Danke!</h2>
        <p className="mt-2 text-muted-foreground">
          Deine Meldung fuer <strong>{kandidatName}</strong> wurde gespeichert.
        </p>
        {total !== null && (
          <p className="mt-1 text-sm text-muted-foreground">
            Gesamt: <strong>{total} / 100</strong> Vertraege
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="anzahl_vertraege">
            Anzahl Vertraege
          </Label>
          <Input
            id="anzahl_vertraege"
            name="anzahl_vertraege"
            type="number"
            min={0}
            required
            placeholder="z.B. 12"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Wie viele Vertraege hat {kandidatName} in diesem Zeitraum
            geschrieben?
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/20"
        >
          {pending ? "Wird gemeldet..." : "Vertraege melden"}
        </Button>
      </form>
    </div>
  );
}
