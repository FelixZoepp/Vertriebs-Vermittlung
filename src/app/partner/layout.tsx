import { getAuthUser } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  return (
    <div className="flex h-screen bg-background">
      <SidebarNav role={user.role} userName={user.name} email={user.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
