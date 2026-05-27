import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  GraduationCap,
  Search,
  Bell,
  Moon,
  Sun,
  WifiOff,
  Languages,
  Gauge,
  Menu,
  LogIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FeatureBadge } from "@/components/coming-soon";
import { appNavigation, navFeatureId } from "@/config/navigation";
import { getSelectedDepartment, clearSelectedDepartment } from "@/lib/session";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [lowData, setLowData] = useState(false);
  const [lang, setLang] = useState<"EN" | "አማ">("EN");
  const [offline, setOffline] = useState(false);
  const [department, setDepartment] = useState<ReturnType<typeof getSelectedDepartment>>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    setDepartment(getSelectedDepartment());
  }, [pathname]);

  function handleSignOut() {
    clearSelectedDepartment();
    setDepartment(null);
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {offline && (
        <div className="bg-amber-500/95 text-amber-950 text-xs px-4 py-1.5 text-center font-medium">
          <WifiOff className="inline h-3 w-3 mr-1.5" />
          Offline preview — real cached materials are not available yet
        </div>
      )}

      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
          <Brand />
          <nav className="flex-1 px-3 py-4 space-y-1">
            {appNavigation.map((item) => {
              const active = pathname.startsWith(item.to);
              const featureId = navFeatureId(item);
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
                  <span className="flex-1 truncate">{item.label}</span>
                  {!active && <FeatureBadge featureId={featureId} className="scale-90 opacity-80" />}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-4 space-y-3">
            <ToggleRow
              icon={<Gauge className="h-4 w-4" />}
              label="Low-data mode"
              checked={lowData}
              onChange={setLowData}
              disabled
            />
            <ToggleRow
              icon={<WifiOff className="h-4 w-4" />}
              label="Simulate offline"
              checked={offline}
              onChange={setOffline}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
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
                    {appNavigation.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent"
                      >
                        <item.icon className="h-4 w-4" /> {item.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials, courses, departments…"
                  className="pl-9 bg-muted/40 border-0"
                  disabled
                  title="Global search is coming soon"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLang(lang === "EN" ? "አማ" : "EN")}
                className="gap-1.5"
                title="Amharic UI — coming soon"
              >
                <Languages className="h-4 w-4" /> {lang}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                disabled
                title="Notifications — coming soon"
              >
                <Bell className="h-4 w-4" />
              </Button>

              {department ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {department.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="font-medium">Guest session</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {department.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{department.college}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/departments" })}>
                      Switch department
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                      Clear session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <LogIn className="h-4 w-4" />
                    Sign in
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
          {appNavigation.slice(0, 5).map((item) => {
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
                {item.label}
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
    <Link to="/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
      <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">StudyKit ET</div>
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
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}
