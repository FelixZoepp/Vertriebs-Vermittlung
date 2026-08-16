import { getAuthUser } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  return (
    <div className="flex h-screen">
      <SidebarNav role={user.role} userName={user.name} email={user.email} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
