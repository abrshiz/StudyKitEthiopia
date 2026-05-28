import type { LucideIcon } from "lucide-react";

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

export type Badge = {
  name: string;
  icon: string;
  earned: boolean;
  description?: string;
};

export type CourseProgress = {
  course: string;
  percent: number;
  hours: string;
};

export type ProgressSummary = {
  currentStreak: string;
  longestStreak: string;
  weeklyHours: string;
  materialsRead: number;
  weeklyActivity: number[];
  badges: Badge[];
  courses: CourseProgress[];
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "material" | "billing" | "system" | "ai";
};

export type ChatMessage = {
  id?: string;
  role: "user" | "ai";
  text: string;
};

export type SearchResults = {
  pages: { to: string; label: string }[];
  materials: StudyMaterial[];
  departments: Department[];
};

export type AdminKpi = { label: string; value: string; delta: string };
export type AdminUpload = { title: string; department: string; uploader: string };
export type AdminTopMaterial = { title: string; downloads: number };
export type SupportTicket = {
  id: string;
  subject: string;
  user: string;
  status: "Open" | "In progress" | "Resolved";
  time: string;
};
export type AuditEntry = [string, string, string, string];

export type AdminDashboard = {
  kpis: AdminKpi[];
  recentUploads: AdminUpload[];
  topMaterials: AdminTopMaterial[];
  tickets: SupportTicket[];
  auditLog: AuditEntry[];
};

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};
