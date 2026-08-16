import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import type { Placement } from "@/lib/types";
import { PlacementCard } from "./_components/placement-card";
import { Users } from "lucide-react";

export default async function PartnerKandidatenPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Get the partner record for the current user
  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (partnerError || !partner) {
    return (
      <p className="text-destructive">
        Kein Partner-Konto mit diesem Benutzer verknüpft.
      </p>
    );
  }

  // Fetch placements with joined candidates
  const { data: placements, error } = await supabase
    .from("placements")
    .select("*, candidate:candidates(*)")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-destructive">Fehler beim Laden: {error.message}</p>
    );
  }

  const typedPlacements = (placements ?? []) as Placement[];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
          <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vorgeschlagene Kandidaten</h1>
          <p className="text-sm text-muted-foreground">
            {typedPlacements.length}{" "}
            {typedPlacements.length === 1 ? "Kandidat" : "Kandidaten"} insgesamt
          </p>
        </div>
      </div>

      {typedPlacements.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">
            Es wurden dir noch keine Kandidaten vorgeschlagen.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {typedPlacements.map((p) => (
            <PlacementCard key={p.id} placement={p} />
          ))}
        </div>
      )}
    </div>
  );
}
