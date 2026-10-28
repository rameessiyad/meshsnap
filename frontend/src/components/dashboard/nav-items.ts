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
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  {
    label: "New generation",
    href: "/dashboard/projects/new",
    icon: Sparkles,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    disabled: true,
  },
];

function matches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  if (!matches(pathname, href)) return false;
  // A parent item (Projects) is not active when a more specific item
  // (New generation) matches the current page.
  return !NAV_ITEMS.some(
    (item) =>
      !item.disabled &&
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      matches(pathname, item.href),
  );
}