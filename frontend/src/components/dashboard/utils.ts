import type { AuthUser } from "@/lib/api/auth";

// Name to show for the user: display_name, otherwise the part of the email before "@".
export function getUserName(user: AuthUser | null | undefined): string | null {
  if (!user) return null;
  const displayName = user.display_name?.trim();
  if (displayName) return displayName;
  const prefix = user.email.split("@")[0]?.trim();
  return prefix || null;
}

export function getUserInitial(user: AuthUser | null | undefined): string {
  const name = getUserName(user);
  return name ? name.charAt(0).toUpperCase() : "?";
}

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// "2 days ago", "yesterday", "5 minutes ago"...
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600)
    return relativeFormat.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400)
    return relativeFormat.format(Math.round(seconds / 3600), "hour");
  if (abs < 2_592_000)
    return relativeFormat.format(Math.round(seconds / 86_400), "day");
  return relativeFormat.format(Math.round(seconds / 2_592_000), "month");
}
