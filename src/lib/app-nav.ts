import type { LucideIcon } from "lucide-react";
import { History, Settings2, Sparkles } from "lucide-react";

export const appNavItems: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/", label: "今日简讯", icon: Sparkles },
  { href: "/briefings", label: "历史简讯", icon: History },
  { href: "/settings", label: "个人中心", icon: Settings2 },
];

export function getAppNavTitle(pathname: string): string {
  for (const item of appNavItems) {
    const active =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);
    if (active) return item.label;
  }
  return appNavItems[0].label;
}
