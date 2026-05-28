/**
 * Translation strings for English (en) and Amharic (am).
 *
 * Keys are stable identifiers; values are the localized text. Add new keys
 * by extending both maps — the `useT` hook is type-safe over the union.
 */

export type Lang = "en" | "am";

export const strings = {
  appName: { en: "StudyKit ET", am: "ስተዲኪት ET" },
  dashboard: { en: "Dashboard", am: "ዳሽቦርድ" },
  myStudy: { en: "My Study", am: "የእኔ ጥናት" },
  sharedLibrary: { en: "Shared Library", am: "የጋራ ቤተ-መጻሕፍት" },
  library: { en: "Library", am: "ቤተ-መጻሕፍት" },
  aiAssistant: { en: "AI Assistant", am: "AI ረዳት" },
  progress: { en: "Progress", am: "እድገት" },
  billing: { en: "Billing", am: "ክፍያ" },
  professor: { en: "Professor", am: "መምህር" },
  student: { en: "Student", am: "ተማሪ" },

  signIn: { en: "Sign in", am: "ግባ" },
  signOut: { en: "Sign out", am: "ውጣ" },
  register: { en: "Create account", am: "መለያ ፍጠር" },
  email: { en: "Email", am: "ኢሜይል" },
  password: { en: "Password", am: "የይለፍ ቃል" },
  continue: { en: "Continue", am: "ቀጥል" },

  materials: { en: "Materials", am: "ቁሳቁሶች" },
  download: { en: "Download", am: "አውርድ" },
  upload: { en: "Upload", am: "ስቀል" },
  view: { en: "View", am: "ተመልከት" },
  search: { en: "Search", am: "ፈልግ" },

  streak: { en: "Streak", am: "ተከታታይ ቀናት" },
  currentStreak: { en: "Current streak", am: "የአሁኑ ተከታታይነት" },
  longestStreak: { en: "Longest streak", am: "ረዥሙ ተከታታይነት" },
  badges: { en: "Badges", am: "ሜዳሊያዎች" },
  bronze: { en: "Bronze", am: "ነሐስ" },
  silver: { en: "Silver", am: "ብር" },
  gold: { en: "Gold", am: "ወርቅ" },

  notifications: { en: "Notifications", am: "ማሳወቂያዎች" },
  send: { en: "Send", am: "ላክ" },
  close: { en: "Close", am: "ዝጋ" },

  department: { en: "Department", am: "ዘርፍ" },
  course: { en: "Course", am: "ኮርስ" },
  semester: { en: "Semester", am: "ሴሚስተር" },
  year: { en: "Year", am: "ዓመት" },

  free: { en: "Free", am: "ነጻ" },
  premium: { en: "Premium", am: "ፕሬሚየም" },
  plan: { en: "Plan", am: "እቅድ" },
  paymentSuccess: { en: "Payment confirmed", am: "ክፍያ ተረጋግጧል" },

  loading: { en: "Loading…", am: "በመጫን ላይ…" },
  retry: { en: "Retry", am: "ድጋሚ ሞክር" },
  cancel: { en: "Cancel", am: "ሰርዝ" },
  save: { en: "Save", am: "አስቀምጥ" },
  submit: { en: "Submit", am: "ላክ" },

  expired: { en: "Expired", am: "ጊዜው አልፏል" },
  daily: { en: "Daily", am: "ቀን-በ-ቀን" },
  kitsLeft: { en: "Study kits left this month", am: "የዚህ ወር ቀሪ ኪቶች" },

  english: { en: "English", am: "እንግሊዝኛ" },
  amharic: { en: "Amharic", am: "አማርኛ" },
} as const;

export type TranslationKey = keyof typeof strings;

export function t(lang: Lang, key: TranslationKey): string {
  return strings[key]?.[lang] ?? strings[key]?.en ?? String(key);
}

export const LANG_STORAGE_KEY = "studykit:lang";
