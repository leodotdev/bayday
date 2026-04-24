import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"

export const Route = createFileRoute("/inbox")({
  component: InboxPage,
})

function InboxPage() {
  const { isAuthenticated, isLoading } = useCurrentUser()
  const conversations = useQuery(
    api.conversations.getByUser,
    isAuthenticated ? {} : "skip",
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>

      {conversations === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No conversations yet. Message a captain from a listing page to start one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const name =
              c.otherUser?.firstName ??
              c.otherUser?.name ??
              c.otherUser?.email ??
              "User"
            const preview = c.lastMessagePreview ?? "No messages yet."
            const when = c.lastMessageAt
              ? formatDistanceToNow(c.lastMessageAt, { addSuffix: true })
              : ""
            return (
              <Link
                key={c._id}
                to="/conversation/$id"
                params={{ id: c._id }}
                className="block"
              >
                <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                    {c.otherUser?.avatarUrl ? (
                      <img
                        src={c.otherUser.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium">{name}</div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {when}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm text-muted-foreground">
                        {c.listingTitle ? (
                          <span className="mr-1 text-foreground/70">
                            {c.listingTitle}
                          </span>
                        ) : null}
                        {preview}
                      </div>
                      {c.unreadCount > 0 ? (
                        <Badge className="shrink-0">{c.unreadCount}</Badge>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
