import { getAuthUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isPartnerFreigeschaltet } from "@/lib/types";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { PushOptIn } from "@/components/push/push-opt-in";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  // Gate: Partner ohne bezahlte Freischaltung → Zahlungsseite
  if (user.role === "partner") {
    const supabase = await createServiceClient();
    const { data: partner } = await supabase
      .from("partners")
      .select("freischaltung_status, abo_status")
      .eq("user_id", user.id)
      .single();

    if (partner && !isPartnerFreigeschaltet(partner)) {
      redirect("/freischaltung");
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SidebarNav role={user.role} userName={user.name} email={user.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <PushOptIn />
          {children}
        </div>
      </main>
    </div>
  );
}
