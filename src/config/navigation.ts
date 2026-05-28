import {
  CreditCard,
  LayoutDashboard,
  Library,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { NavItem } from "@/lib/types";
import type { StoredUser } from "@/lib/session";

const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/study", label: "My Study", icon: Sparkles },
  { to: "/library", label: "Shared Library", icon: Library },
  { to: "/ai-chat", label: "AI Assistant", icon: MessageSquare },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

/**
 * Single-role nav for the Thea-style pivot. The `getNavigationForRole`
 * shim survives only so the layout can keep calling it without changes.
 */
export function getNavigationForRole(_role: StoredUser["role"]): NavItem[] {
  return studentNav;
}

export const publicNavigation = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Sign in" },
  { to: "/register", label: "Register" },
];
