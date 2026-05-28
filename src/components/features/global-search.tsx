import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, LayoutDashboard } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getNavigationForRole } from "@/config/navigation";
import { resolveUserRole } from "@/lib/auth/role-from-email";
import { useAuth } from "@/context/auth-context";
import { globalSearch } from "@/lib/api/search";
import { isApiConfigured } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

type GlobalSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const navItems = user ? getNavigationForRole(resolveUserRole(user)) : [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const { data } = useQuery({
    queryKey: ["search", query],
    queryFn: () => globalSearch(query),
    enabled: isApiConfigured() && open && query.trim().length >= 2,
    staleTime: 10_000,
  });

  const q = query.trim().toLowerCase();
  const pages = navItems.filter((n) => !q || n.label.toLowerCase().includes(q));

  function go(to: string) {
    onOpenChange(false);
    setQuery("");
    navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, materials, departments…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>
          {isApiConfigured() && query.length >= 2
            ? "No results from your database."
            : "Type to search pages, or connect API for materials & departments."}
        </CommandEmpty>
        {pages.length > 0 && (
          <CommandGroup heading="Pages">
            {pages.map((p) => (
              <CommandItem key={p.to} onSelect={() => go(p.to)}>
                <LayoutDashboard className="h-4 w-4" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data?.materials && data.materials.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Materials">
              {data.materials.map((m) => (
                <CommandItem key={m.id} onSelect={() => go("/library")}>
                  <BookOpen className="h-4 w-4" />
                  <span className="truncate">{m.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {data?.departments && data.departments.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Departments">
              {data.departments.map((d) => (
                <CommandItem key={d.id} onSelect={() => go("/departments")}>
                  <GraduationCap className="h-4 w-4" />
                  <span className="truncate">{d.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
