import { getAuthUser } from "@/lib/auth";

export default async function PartnerDashboard() {
  const user = await getAuthUser();

  return (
    <div>
      <h1 className="text-2xl font-bold">Partner-Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Willkommen, {user.name || user.email}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard label="Vorgeschlagene Kandidaten" value="—" />
        <DashboardCard label="Im Interview" value="—" />
        <DashboardCard label="Eingestellt" value="—" />
      </div>
    </div>
  );
}

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
