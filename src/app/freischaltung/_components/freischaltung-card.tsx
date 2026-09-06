"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startFreischaltungCheckout } from "../_actions";

const LEISTUNGEN = [
  "Zugang zum Pool vorqualifizierter D2D-Vertriebler",
  "PLZ-basiertes Matching in deiner Region",
  "Kandidaten-Empfehlungen direkt ins Dashboard",
  "Vermittlung inkl. Masterclass-geschulter Bewerber",
  "Vertrags-Tracking & transparente Abrechnung",
];

export function FreischaltungCard({
  firmenname,
  abgebrochen,
}: {
  firmenname: string;
  abgebrochen: boolean;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    setError("");
    startTransition(async () => {
      const result = await startFreischaltungCheckout();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-bold">Plattform freischalten</h1>
      {firmenname && (
        <p className="mt-1 text-sm text-muted-foreground">{firmenname}</p>
      )}

      <p className="mt-4 text-muted-foreground">
        Um Zugang zum Kandidaten-Pool und dem Matching zu erhalten, ist eine
        einmalige Freischaltungsgebühr fällig.
      </p>

      <div className="mt-6 rounded-lg bg-muted p-6 text-center">
        <div className="text-4xl font-bold">999 €</div>
        <div className="mt-1 text-sm text-muted-foreground">
          einmalig, netto zzgl. 19% USt
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm">
        {LEISTUNGEN.map((leistung) => (
          <li key={leistung} className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">✓</span>
            <span>{leistung}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        Bei erfolgreicher Einstellung fällt zusätzlich eine Vermittlungsprovision
        von 750 € netto an sowie weitere 750 € netto, sobald der Vertriebler 100
        Verträge erreicht.
      </p>

      {abgebrochen && (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Die Zahlung wurde abgebrochen. Du kannst sie jederzeit fortsetzen.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button
        onClick={handleCheckout}
        disabled={isPending}
        className="mt-6 w-full"
        size="lg"
      >
        {isPending ? "Weiterleitung zu Stripe..." : "Jetzt freischalten — 999 € netto"}
      </Button>
    </div>
  );
}
