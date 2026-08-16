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
import { UserCircle, Eye, EyeOff } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  vorgeschlagen: "Vorgeschlagen",
  erstgespraech: "Erstgespräch",
  vorstellungsgespraech: "Vorstellungsgespräch",
  probetag: "Probetag",
  eingestellt: "Eingestellt",
  abgelehnt: "Abgelehnt",
  abgebrochen: "Abgebrochen",
};

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "eingestellt":
      return "default";
    case "abgelehnt":
    case "abgebrochen":
      return "destructive";
    case "erstgespraech":
    case "vorstellungsgespraech":
    case "probetag":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case "eingestellt":
      return "bg-green-500";
    case "erstgespraech":
    case "vorstellungsgespraech":
    case "probetag":
      return "bg-amber-500";
    case "abgelehnt":
    case "abgebrochen":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

export function PlacementCard({ placement }: { placement: Placement }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const candidate = placement.candidate;
  const isAnonymized = placement.status === "vorgeschlagen";

  async function handleAction(
    action: "interesse" | "erstgespraech" | "vorstellungsgespraech" | "probetag" | "eingestellt" | "abgelehnt"
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
    <Card
      className={`relative overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
        isAnonymized ? "border-dashed" : ""
      }`}
    >
      {/* Anonymized overlay indicator */}
      {isAnonymized && (
        <div className="absolute right-3 top-3">
          <EyeOff className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isAnonymized
                ? "bg-muted"
                : "bg-red-100 dark:bg-red-900/20"
            }`}
          >
            <UserCircle
              className={`h-5 w-5 ${
                isAnonymized
                  ? "text-muted-foreground/50"
                  : "text-red-600 dark:text-red-400"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">
              {isAnonymized
                ? `Kandidat #${placement.candidate_id}`
                : candidate
                  ? `${candidate.vorname} ${candidate.nachname}`
                  : `Kandidat #${placement.candidate_id}`}
            </CardTitle>
            <Badge
              variant={getStatusBadgeVariant(placement.status)}
              className="mt-1 gap-1.5"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${getStatusDotColor(placement.status)}`}
              />
              {STATUS_LABELS[placement.status] ?? placement.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <dl
          className={`grid gap-2 text-sm sm:grid-cols-2 ${
            isAnonymized ? "select-none" : ""
          }`}
        >
          {candidate?.plz && (
            <div>
              <dt className="text-muted-foreground">PLZ</dt>
              <dd className={`font-medium ${isAnonymized ? "blur-sm" : ""}`}>
                {candidate.plz}
              </dd>
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
              <div className="sm:col-span-2">
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

          {/* Contact info only when not anonymized */}
          {!isAnonymized && candidate && (
            <>
              <div>
                <dt className="text-muted-foreground">E-Mail</dt>
                <dd className="font-medium truncate">{candidate.email}</dd>
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
              <dd className="font-medium">
                <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                  {placement.match_score}%
                </span>
              </dd>
            </div>
          )}
        </dl>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>

      {(placement.status === "vorgeschlagen" ||
        placement.status === "erstgespraech" ||
        placement.status === "vorstellungsgespraech" ||
        placement.status === "probetag") && (
        <CardFooter className="flex-wrap gap-2 border-t bg-muted/30 px-6 py-3">
          {placement.status === "vorgeschlagen" && (
            <Button
              size="sm"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm shadow-red-500/20 hover:from-red-700 hover:to-red-800"
              onClick={() => handleAction("interesse")}
              disabled={loading}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Interesse
            </Button>
          )}
          {placement.status === "probetag" && (
            <Button
              size="sm"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm shadow-red-500/20 hover:from-red-700 hover:to-red-800"
              onClick={() => handleAction("eingestellt")}
              disabled={loading}
            >
              Eingestellt
            </Button>
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
