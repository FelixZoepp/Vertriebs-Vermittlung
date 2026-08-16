"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Placement } from "@/lib/types";
import { expressInterest, updatePlacementStatus } from "../_actions";

const STATUS_LABELS: Record<string, string> = {
  vorgeschlagen: "Vorgeschlagen",
  interview: "Interview",
  eingestellt: "Eingestellt",
  abgelehnt: "Abgelehnt",
  abgebrochen: "Abgebrochen",
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "eingestellt"
      ? "default"
      : status === "abgelehnt" || status === "abgebrochen"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function PlacementCard({ placement }: { placement: Placement }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const candidate = placement.candidate;
  const isAnonymized = placement.status === "vorgeschlagen";

  async function handleAction(
    action: "interesse" | "interview" | "eingestellt" | "abgelehnt"
  ) {
    setLoading(true);
    setError("");

    let result;
    if (action === "interesse") {
      result = await expressInterest(placement.id);
    } else {
      result = await updatePlacementStatus(placement.id, action);
    }

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isAnonymized
              ? `Kandidat #${placement.candidate_id}`
              : candidate
                ? `${candidate.vorname} ${candidate.nachname}`
                : `Kandidat #${placement.candidate_id}`}
          </CardTitle>
          <StatusBadge status={placement.status} />
        </div>
      </CardHeader>

      <CardContent>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {candidate?.plz && (
            <div>
              <dt className="text-muted-foreground">PLZ</dt>
              <dd className="font-medium">{candidate.plz}</dd>
            </div>
          )}
          {candidate && (
            <div>
              <dt className="text-muted-foreground">Erfahrung</dt>
              <dd className="font-medium">
                {candidate.erfahrung_jahre}{" "}
                {candidate.erfahrung_jahre === 1 ? "Jahr" : "Jahre"}
              </dd>
            </div>
          )}
          {candidate?.branchenerfahrung &&
            candidate.branchenerfahrung.length > 0 && (
              <div>
                <dt className="text-muted-foreground">Branchenerfahrung</dt>
                <dd className="font-medium">
                  {candidate.branchenerfahrung.join(", ")}
                </dd>
              </div>
            )}
          {candidate?.verfuegbar_ab && (
            <div>
              <dt className="text-muted-foreground">Verfügbar ab</dt>
              <dd className="font-medium">
                {new Date(candidate.verfuegbar_ab).toLocaleDateString("de-DE")}
              </dd>
            </div>
          )}

          {/* Show contact info only when not anonymized */}
          {!isAnonymized && candidate && (
            <>
              <div>
                <dt className="text-muted-foreground">E-Mail</dt>
                <dd className="font-medium">{candidate.email}</dd>
              </div>
              {candidate.telefon && (
                <div>
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd className="font-medium">{candidate.telefon}</dd>
                </div>
              )}
            </>
          )}

          {placement.match_score !== null && (
            <div>
              <dt className="text-muted-foreground">Match-Score</dt>
              <dd className="font-medium">{placement.match_score}%</dd>
            </div>
          )}
        </dl>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>

      {(placement.status === "vorgeschlagen" ||
        placement.status === "interview") && (
        <CardFooter className="flex-wrap gap-2">
          {placement.status === "vorgeschlagen" && (
            <Button
              size="sm"
              onClick={() => handleAction("interesse")}
              disabled={loading}
            >
              Interesse
            </Button>
          )}
          {placement.status === "interview" && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction("eingestellt")}
                disabled={loading}
              >
                Eingestellt
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction("abgelehnt")}
            disabled={loading}
          >
            Abgelehnt
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
