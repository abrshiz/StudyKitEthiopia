import {
  BarChart3,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Library,
  Megaphone,
  MessageSquare,
  Shield,
  TrendingUp,
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
  { to: "/support/new", label: "Support", icon: LifeBuoy },
];

const professorNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/professor", label: "My department", icon: GraduationCap },
  { to: "/professor/upload", label: "Upload", icon: Upload },
  { to: "/professor/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/professor/tickets", label: "Tickets", icon: MessageSquare },
];

const adminNav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin", label: "Admin panel", icon: Shield },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  { to: "/admin/notifications", label: "Broadcast", icon: Megaphone },
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
