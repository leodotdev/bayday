import { useMutation, useQuery } from "convex/react"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

export function NotificationsBell() {
  const { isAuthenticated } = useCurrentUser()
  const items = useQuery(
    api.notifications.listForCurrentUser,
    isAuthenticated ? {} : "skip",
  )
  const unreadCount = useQuery(
    api.notifications.unreadCountForCurrentUser,
    isAuthenticated ? {} : "skip",
  )
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)

  if (!isAuthenticated) return null

  const unread = unreadCount ?? 0

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
        <span className="sr-only">Notifications</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead({})}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <ScrollArea className="max-h-96">
          {items === undefined ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li
                  key={n._id}
                  className={cn(
                    "border-b last:border-b-0",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      markRead({ id: n._id })
                    }
                    className="block w-full p-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(n.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t" />
        <Badge variant="outline" className="hidden">
          {unread}
        </Badge>
      </PopoverContent>
    </Popover>
  )
}
