import { getAuthUser } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileHeader, MobileTabBar } from "@/components/mobile-nav";
import { PushOptIn } from "@/components/push/push-opt-in";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  return (
    <div className="flex h-dvh flex-col bg-background md:flex-row">
      <SidebarNav role={user.role} userName={user.name} email={user.email} />
      <MobileHeader role={user.role} userName={user.name} email={user.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-8 lg:px-8">
          <PushOptIn />
          {children}
        </div>
      </main>
      <MobileTabBar role={user.role} />
    </div>
  );
}
