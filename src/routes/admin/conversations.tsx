import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/admin/conversations")({
  component: AdminConversations,
})

function AdminConversations() {
  const conversations = useQuery(api.admin.listConversations, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Conversations
        </h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of every chat thread. Useful for support audits.
        </p>
      </div>

      {conversations === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participants</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="text-sm">
                    {c.participants
                      .map((p) => p?.email ?? p?.firstName ?? "user")
                      .join(" ↔ ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.listing?.title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.type}</Badge>
                  </TableCell>
                  <TableCell>{c.messageCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.lastMessageAt
                      ? formatDistanceToNow(c.lastMessageAt, {
                          addSuffix: true,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {c.isArchived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
