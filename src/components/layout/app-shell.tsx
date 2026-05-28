import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  GraduationCap,
  Search,
  Moon,
  Sun,
  WifiOff,
  Languages,
  Gauge,
  Menu,
  LogIn,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/features/global-search";
import { NotificationsMenu } from "@/components/features/notifications-menu";
import { SetupHint } from "@/components/shared/api-state";
import { useAppPreferences } from "@/context/app-preferences";
import { useAuth } from "@/context/auth-context";
import { getUserInitials } from "@/lib/session";
import { getNavigationForRole } from "@/config/navigation";
import { resolveUserRole } from "@/lib/auth/role-from-email";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/strings";

const NAV_TO_KEY: Record<string, TranslationKey> = {
  "/dashboard": "dashboard",
  "/study": "myStudy",
  "/library": "sharedLibrary",
  "/ai-chat": "aiAssistant",
  "/progress": "progress",
  "/billing": "billing",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dark, setDark, lowData, setLowData, offline, setOffline } = useAppPreferences();
  const { lang, toggle: toggleLang, t } = useT();
  const { user, department, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const navItems = user ? getNavigationForRole(resolveUserRole(user)) : [];

  const translateLabel = (to: string, fallback: string): string => {
    const key = NAV_TO_KEY[to];
    return key ? t(key) : fallback;
  };

  const avatarLabel = user
    ? getUserInitials(user.name)
    : (department?.name.slice(0, 2).toUpperCase() ?? "SK");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {offline && (
        <div className="bg-gold/90 text-earth text-xs px-4 py-1.5 text-center font-medium">
          <WifiOff className="inline h-3 w-3 mr-1.5" />
          Offline mode — only cached items from your last session are shown
        </div>
      )}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
          <Brand />
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {translateLabel(item.to, item.label)}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-4 space-y-3">
            <SetupHint />
            <ToggleRow
              icon={<Gauge className="h-4 w-4" />}
              label="Low-data mode"
              checked={lowData}
              onChange={setLowData}
            />
            <ToggleRow
              icon={<WifiOff className="h-4 w-4" />}
              label="Offline mode"
              checked={offline}
              onChange={setOffline}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 backdrop-blur bg-background/85 border-b border-border">
            <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <Brand />
                  <nav className="px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent"
                        >
                          <item.icon className="h-4 w-4" /> {translateLabel(item.to, item.label)}
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="relative flex-1 max-w-xl flex items-center h-9 rounded-md bg-muted/60 px-3 text-sm text-muted-foreground hover:bg-muted transition"
              >
                <Search className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Search…</span>
                <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border bg-background px-1.5 text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                className="gap-1.5"
                title={t(lang === "en" ? "amharic" : "english")}
              >
                <Languages className="h-4 w-4" /> {lang === "en" ? "EN" : "አማ"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <NotificationsMenu />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {avatarLabel}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                      {department && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {department.name}
                        </div>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {resolveUserRole(user) === "student" && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/departments" })}>
                        Switch department
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate({ to: "/billing" })}>
                      Subscription
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        signOut();
                        navigate({ to: "/login" });
                      }}
                    >
                      {t("signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <LogIn className="h-4 w-4" />
                    {t("signIn")}
                  </Button>
                </Link>
              )}
            </div>
          </header>

          <main className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">{children}</main>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-5">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center py-2 gap-0.5 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {translateLabel(item.to, item.label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border"
    >
      <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight text-earth dark:text-foreground">
          StudyKit ET
        </div>
        <div className="text-[10px] text-muted-foreground">University Edition</div>
      </div>
    </Link>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
