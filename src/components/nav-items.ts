import type { UserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  Target,
  FileText,
  UserCircle,
  GraduationCap,
  Settings,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  /** Kurzlabel für die Bottom-Tab-Bar */
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Kandidaten", href: "/admin/kandidaten", icon: Users },
    { label: "Partner", href: "/admin/partner", icon: Building2 },
    { label: "Vermittlungen", shortLabel: "Vermittl.", href: "/admin/vermittlungen", icon: Handshake },
    { label: "Matching", href: "/admin/vermittlungen/matching", icon: Target },
    { label: "Rechnungen", href: "/admin/rechnungen", icon: Receipt },
    { label: "Masterclass", href: "/admin/masterclass", icon: GraduationCap },
  ],
  partner: [
    { label: "Dashboard", href: "/partner", icon: LayoutDashboard },
    { label: "Kandidaten-Pool", shortLabel: "Pool", href: "/partner/pool", icon: Target },
    { label: "Kandidaten", href: "/partner/kandidaten", icon: Users },
    { label: "Vertrags-Tracking", shortLabel: "Verträge", href: "/partner/vertraege", icon: FileText },
    { label: "Rechnungen", href: "/partner/rechnungen", icon: Receipt },
    { label: "Einstellungen", href: "/partner/einstellungen", icon: Settings },
  ],
  candidate: [
    { label: "Profil", href: "/kandidat", icon: UserCircle },
    { label: "Masterclass", href: "/kandidat/masterclass", icon: GraduationCap },
  ],
};

/** Anzahl der Items, die mobil direkt in der Tab-Bar landen (Rest → "Mehr"). */
export const MOBILE_TAB_COUNT = 4;

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  role: UserRole
): boolean {
  const roleBase = role === "candidate" ? "kandidat" : role;
  const isExactMatch = item.href === pathname;
  const isPrefixMatch =
    item.href !== `/${roleBase}` && pathname.startsWith(item.href);
  return isExactMatch || isPrefixMatch;
}

export function logout() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/logout";
  document.body.appendChild(form);
  form.submit();
}
