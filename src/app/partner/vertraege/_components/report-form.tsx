"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Placement } from "@/lib/types";
import { reportContracts } from "../_actions";

interface ReportFormProps {
  placements: Placement[];
}

export function ReportForm({ placements }: ReportFormProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);

    const result = await reportContracts(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Verträge erfolgreich gemeldet." });
    }
    setPending(false);
  }

  if (placements.length === 0) return null;

  // Generate current month as default YYYY-MM
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Verträge melden</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placement_id">Vermittlung</Label>
            <select
              id="placement_id"
              name="placement_id"
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Bitte wählen...</option>
              {placements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.candidate
                    ? `${p.candidate.vorname} ${p.candidate.nachname}`
                    : `Vermittlung #${p.id}`}{" "}
                  ({p.vertraege_gesamt}/100)
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zeitraum_monat">Zeitraum (Monat)</Label>
              <Input
                id="zeitraum_monat"
                name="zeitraum_monat"
                type="month"
                defaultValue={defaultMonth}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anzahl_vertraege">Anzahl Verträge</Label>
              <Input
                id="anzahl_vertraege"
                name="anzahl_vertraege"
                type="number"
                min={1}
                required
              />
            </div>
          </div>

          {message && (
            <p
              className={`text-sm ${message.type === "error" ? "text-destructive" : "text-green-600"}`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Wird gemeldet..." : "Verträge melden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
