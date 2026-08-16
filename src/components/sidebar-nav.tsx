"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  Target,
  FileText,
  Film,
  UserCircle,
  GraduationCap,
  Settings,
  Receipt,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Kandidaten", href: "/admin/kandidaten", icon: Users },
    { label: "Partner", href: "/admin/partner", icon: Building2 },
    { label: "Vermittlungen", href: "/admin/vermittlungen", icon: Handshake },
    { label: "Matching", href: "/admin/vermittlungen/matching", icon: Target },
    { label: "Rechnungen", href: "/admin/rechnungen", icon: Receipt },
  ],
  partner: [
    { label: "Dashboard", href: "/partner", icon: LayoutDashboard },
    { label: "Kandidaten", href: "/partner/kandidaten", icon: Users },
    { label: "Verträge", href: "/partner/vertraege", icon: FileText },
    { label: "Rechnungen", href: "/partner/rechnungen", icon: Receipt },
    { label: "Einstellungen", href: "/partner/einstellungen", icon: Settings },
  ],
  candidate: [
    { label: "Profil", href: "/kandidat", icon: UserCircle },
    { label: "Masterclass", href: "/kandidat/masterclass", icon: GraduationCap },
  ],
};

interface SidebarNavProps {
  role: UserRole;
  userName: string | null;
  email: string;
}

export function SidebarNav({ role, userName, email }: SidebarNavProps) {
  const pathname = usePathname();
  const items = navItems[role];
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0].toUpperCase();

  const roleBase = role === "candidate" ? "kandidat" : role;

  return (
    <aside className="flex h-screen w-60 flex-col bg-gradient-to-b from-[#1a0a0a] to-[#0d0507] text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
          <span className="text-sm font-bold text-white">ZM</span>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">Zoepp Media</p>
          <p className="text-[10px] uppercase tracking-widest text-red-400/80">
            {role === "admin" ? "Admin" : role === "partner" ? "Partner" : "Kandidat"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isExactMatch = item.href === pathname;
          const isPrefixMatch =
            item.href !== `/${roleBase}` && pathname.startsWith(item.href);
          const isActive = isExactMatch || isPrefixMatch;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-red-600/30 to-red-500/10 text-white shadow-sm shadow-red-500/10 border border-red-500/20"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  isActive ? "text-red-400" : "text-white/40 group-hover:text-white/70"
                )}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-red-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="truncate text-sm font-medium text-white/90">
                {userName || email}
              </p>
              <p className="truncate text-[11px] text-white/40">{email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem
              onClick={() => {
                const form = document.createElement("form");
                form.method = "POST";
                form.action = "/api/auth/logout";
                document.body.appendChild(form);
                form.submit();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
