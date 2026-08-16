import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import type { Partner } from "@/lib/types";
import { SettingsForm } from "./_components/settings-form";

export default async function PartnerEinstellungenPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: partner, error } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !partner) {
    return (
      <p className="text-destructive">
        Kein Partner-Konto mit diesem Benutzer verknüpft.
      </p>
    );
  }

  const typedPartner = partner as Partner;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalte dein Suchprofil und offene Stellen.
        </p>
      </div>

      <div className="mt-6">
        <SettingsForm partner={typedPartner} />
      </div>
    </div>
  );
}
