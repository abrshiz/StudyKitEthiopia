import {
  LayoutDashboard,
  Library,
  MessageSquare,
  TrendingUp,
  CreditCard,
  Shield,
  Upload,
} from "lucide-react";
import type { NavItem } from "@/lib/types";
import type { StoredUser } from "@/lib/session";

const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/library", label: "Library", icon: Library },
  { to: "/ai-chat", label: "AI Assistant", icon: MessageSquare },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

const professorNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/library", label: "Course library", icon: Library },
  { to: "/ai-chat", label: "AI tools", icon: MessageSquare },
  { to: "/admin", label: "Upload materials", icon: Upload },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin", label: "Admin panel", icon: Shield },
  { to: "/library", label: "All materials", icon: Library },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

export function getNavigationForRole(role: StoredUser["role"]): NavItem[] {
  switch (role) {
    case "admin":
      return adminNav;
    case "professor":
      return professorNav;
    default:
      return studentNav;
  }
}

export const publicNavigation = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Sign in" },
  { to: "/register", label: "Register" },
];
