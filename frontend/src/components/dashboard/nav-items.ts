import {
  FolderOpen,
  LayoutDashboard,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean; // pages that do not exist yet
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
    disabled: true,
  },
  {
    label: "New generation",
    href: "/dashboard/new",
    icon: Sparkles,
    disabled: true,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    disabled: true,
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
