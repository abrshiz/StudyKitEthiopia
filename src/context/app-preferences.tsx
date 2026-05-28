import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AppPreferences = {
  dark: boolean;
  setDark: (v: boolean) => void;
  lowData: boolean;
  setLowData: (v: boolean) => void;
  offline: boolean;
  setOffline: (v: boolean) => void;
  lang: "EN" | "አማ";
  setLang: (v: "EN" | "አማ") => void;
};

const AppPreferencesContext = createContext<AppPreferences | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [lowData, setLowData] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lang, setLang] = useState<"EN" | "አማ">("EN");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    document.documentElement.classList.toggle("low-data", lowData);
  }, [lowData]);

  return (
    <AppPreferencesContext.Provider
      value={{ dark, setDark, lowData, setLowData, offline, setOffline, lang, setLang }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferences {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  return ctx;
}
