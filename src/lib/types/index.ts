export type Department = {
  id: string;
  name: string;
  college: string;
  students?: number;
};

export type StudyMaterial = {
  id: string;
  title: string;
  type: "PDF" | "PPT" | "DOC" | string;
  course: string;
  semester: string;
  size: string;
  updated: string;
  downloads?: number;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  popular?: boolean;
  features: string[];
};

import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  featureId: string;
};
