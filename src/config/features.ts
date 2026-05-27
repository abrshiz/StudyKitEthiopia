/**
 * Tracks what is implemented vs planned. UI reads this to show badges and disable actions.
 */
export type FeatureStatus = "ready" | "partial" | "planned";

export type Feature = {
  id: string;
  label: string;
  status: FeatureStatus;
  description: string;
};

export const features = {
  auth: {
    id: "auth",
    label: "Sign in & registration",
    status: "partial",
    description: "Email validation works; session API and MFA are not connected yet.",
  },
  departments: {
    id: "departments",
    label: "Department catalog",
    status: "planned",
    description: "231 departments will load from the API once the catalog is connected.",
  },
  library: {
    id: "library",
    label: "Content library",
    status: "planned",
    description: "Materials, downloads, and watermarked previews need a backend.",
  },
  aiChat: {
    id: "ai-chat",
    label: "AI study assistant",
    status: "planned",
    description: "Grounded chat requires your course materials and an AI provider.",
  },
  progress: {
    id: "progress",
    label: "Progress & badges",
    status: "planned",
    description: "Streaks and completion stats will sync when activity tracking is live.",
  },
  billing: {
    id: "billing",
    label: "Payments",
    status: "partial",
    description: "Plan selection UI is ready; TeleBirr, Chapa, and CBE Birr are not integrated.",
  },
  admin: {
    id: "admin",
    label: "Admin panel",
    status: "planned",
    description: "Content uploads, analytics, and support tools need admin APIs.",
  },
  search: {
    id: "search",
    label: "Global search",
    status: "planned",
    description: "Search across materials, courses, and departments is not wired yet.",
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    status: "planned",
    description: "Push and in-app alerts are not connected yet.",
  },
  offline: {
    id: "offline",
    label: "Offline mode",
    status: "planned",
    description: "Cached materials and offline sync are not implemented yet.",
  },
} as const satisfies Record<string, Feature>;

export type FeatureId = keyof typeof features;

export function getFeature(id: FeatureId): Feature {
  return features[id];
}

export function isFeatureReady(id: FeatureId): boolean {
  return features[id].status === "ready";
}
