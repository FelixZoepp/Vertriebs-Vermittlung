"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
}

const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Kandidaten", href: "/admin/kandidaten" },
    { label: "Partner", href: "/admin/partner" },
    { label: "Vermittlungen", href: "/admin/vermittlungen" },
    { label: "Rechnungen", href: "/admin/rechnungen" },
    { label: "Content", href: "/admin/content" },
  ],
  partner: [
    { label: "Dashboard", href: "/partner" },
    { label: "Kandidaten", href: "/partner/kandidaten" },
    { label: "Verträge", href: "/partner/vertraege" },
    { label: "Rechnungen", href: "/partner/rechnungen" },
    { label: "Einstellungen", href: "/partner/einstellungen" },
  ],
  candidate: [
    { label: "Profil", href: "/kandidat" },
    { label: "Masterclass", href: "/kandidat/masterclass" },
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

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">Zoepp Media</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const isActive =
            item.href === pathname ||
            (item.href !== `/${role === "candidate" ? "kandidat" : role}` &&
              pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">
              {userName || email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                const form = document.createElement("form");
                form.method = "POST";
                form.action = "/api/auth/logout";
                document.body.appendChild(form);
                form.submit();
              }}
            >
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
