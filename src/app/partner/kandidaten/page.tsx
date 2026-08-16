import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import type { Placement } from "@/lib/types";
import { PlacementCard } from "./_components/placement-card";

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
      <div>
        <h1 className="text-2xl font-bold">Vorgeschlagene Kandidaten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {typedPlacements.length}{" "}
          {typedPlacements.length === 1 ? "Kandidat" : "Kandidaten"} insgesamt
        </p>
      </div>

      {typedPlacements.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          Es wurden dir noch keine Kandidaten vorgeschlagen.
        </p>
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
