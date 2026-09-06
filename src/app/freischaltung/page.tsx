import { getAuthUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isPartnerFreigeschaltet } from "@/lib/types";
import { redirect } from "next/navigation";
import { FreischaltungCard } from "./_components/freischaltung-card";

export default async function FreischaltungPage({
  searchParams,
}: {
  searchParams: Promise<{ abgebrochen?: string }>;
}) {
  const user = await getAuthUser();
  if (user.role === "admin") redirect("/admin");
  if (user.role === "candidate") redirect("/kandidat");

  const supabase = await createServiceClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("firmenname, freischaltung_status, abo_status")
    .eq("user_id", user.id)
    .single();

  if (partner && isPartnerFreigeschaltet(partner)) {
    redirect("/partner");
  }

  const { abgebrochen } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <FreischaltungCard
        firmenname={partner?.firmenname ?? ""}
        abgebrochen={abgebrochen === "1"}
      />
    </div>
  );
}
