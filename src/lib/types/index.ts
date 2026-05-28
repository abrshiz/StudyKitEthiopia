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
  courseCode?: string;
  courseId?: string;
  semester: string;
  size: string;
  updated: string;
  downloads?: number;
  expiryDate?: string | null;
  expired?: boolean;
  departmentId?: string;
};

export type Course = {
  id: string;
  departmentId: string;
  code: string;
  title: string;
  year: number;
  semester: string;
  credits: number;
  active: boolean;
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

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};
