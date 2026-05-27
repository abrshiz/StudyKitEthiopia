import {
  LayoutDashboard,
  Library,
  MessageSquare,
  TrendingUp,
  CreditCard,
  Shield,
} from "lucide-react";
import type { FeatureId } from "@/config/features";
import type { NavItem } from "@/lib/types";

export const appNavigation: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, featureId: "library" },
  { to: "/library", label: "Library", icon: Library, featureId: "library" },
  { to: "/ai-chat", label: "AI Assistant", icon: MessageSquare, featureId: "aiChat" },
  { to: "/progress", label: "Progress", icon: TrendingUp, featureId: "progress" },
  { to: "/billing", label: "Billing", icon: CreditCard, featureId: "billing" },
  { to: "/admin", label: "Admin", icon: Shield, featureId: "admin" },
];

export function navFeatureId(item: NavItem): FeatureId {
  return item.featureId as FeatureId;
}
