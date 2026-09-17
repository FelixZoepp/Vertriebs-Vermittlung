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
  navItems,
  isNavItemActive,
  logout,
  MOBILE_TAB_COUNT,
} from "@/components/nav-items";
import { LogOut, MoreHorizontal } from "lucide-react";

interface MobileNavProps {
  role: UserRole;
  userName: string | null;
  email: string;
}

/** Mobile Top-Bar: Logo + Rolle + Avatar (Logout). Nur unter md sichtbar. */
export function MobileHeader({ role, userName, email }: MobileNavProps) {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#1a0a0a] to-[#0d0507] px-4 pt-[env(safe-area-inset-top)] text-white md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
          <span className="text-xs font-bold text-white">ZM</span>
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight tracking-wide">
            Zoepp Media
          </p>
          <p className="text-[9px] uppercase leading-tight tracking-widest text-red-400/80">
            {role === "admin" ? "Admin" : role === "partner" ? "Partner" : "Kandidat"}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Konto"
          className="rounded-full transition-opacity active:opacity-70"
        >
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{userName || email}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

/** Mobile Bottom-Tab-Bar. Nur unter md sichtbar. */
export function MobileTabBar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = navItems[role];

  const needsMore = items.length > MOBILE_TAB_COUNT;
  const tabItems = needsMore ? items.slice(0, MOBILE_TAB_COUNT) : items;
  const moreItems = needsMore ? items.slice(MOBILE_TAB_COUNT) : [];
  const moreActive = moreItems.some((item) =>
    isNavItemActive(item, pathname, role)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(item, pathname, role);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors active:opacity-70",
                isActive ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[10px] font-medium leading-none">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          );
        })}
        {needsMore && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors active:opacity-70",
                moreActive ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">Mehr</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item, pathname, role);
                return (
                  <DropdownMenuItem
                    key={item.href}
                    render={<Link href={item.href} />}
                    className={cn("min-h-11", isActive && "text-red-500")}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
