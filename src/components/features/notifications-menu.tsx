import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useNotificationActions } from "@/hooks/use-notifications";
import { isApiConfigured } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function NotificationsMenu() {
  const { data: items = [], isLoading } = useNotifications();
  const { markRead, markAllRead } = useNotificationActions();
  const unread = items.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" disabled={!isApiConfigured()}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground grid place-items-center">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && isApiConfigured() && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary font-normal"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isApiConfigured() ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Connect API to load notifications
          </div>
        ) : isLoading ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 py-3 cursor-pointer"
              onClick={() => markRead.mutate(n.id)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={cn("text-sm font-medium", !n.read && "text-foreground")}>
                  {n.title}
                </span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
              <span className="text-[10px] text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
