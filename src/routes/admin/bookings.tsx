import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateOnly, formatPriceCents } from "@/lib/format"

type Status =
  | "pending"
  | "confirmed"
  | "cancelled_by_guest"
  | "cancelled_by_host"
  | "completed"
  | "no_show"
  | "disputed"

const STATUSES: Array<Status> = [
  "pending",
  "confirmed",
  "completed",
  "cancelled_by_guest",
  "cancelled_by_host",
  "no_show",
  "disputed",
]

const LABEL: Record<Status, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled_by_guest: "Cancelled (guest)",
  cancelled_by_host: "Cancelled (host)",
  no_show: "No-show",
  disputed: "Disputed",
}

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
})

function AdminBookings() {
  const bookings = useQuery(api.admin.listBookings, {})
  const setStatus = useMutation(api.admin.setBookingStatus)

  async function onStatus(id: Id<"bookings">, status: Status) {
    try {
      await setStatus({ id, status })
      toast.success(`Status → ${LABEL[status]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Every booking across the platform with override controls.
        </p>
      </div>

      {bookings === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Sharing</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const guestLabel =
                  b.guest?.email ?? b.guestEmail ?? b.guestName ?? "—"
                return (
                  <TableRow key={b._id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {b.guestName ?? b.guest?.firstName ?? "Guest"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {guestLabel}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.listing?.title ?? "—"}
                      <div className="text-xs text-muted-foreground">
                        {b.listing?.departureCity}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateOnly(b.date)}
                    </TableCell>
                    <TableCell>{b.partySize}</TableCell>
                    <TableCell className="font-medium">
                      {formatPriceCents(b.totalPriceCents)}
                    </TableCell>
                    <TableCell>
                      {b.costSharingEnabled ? (
                        <Badge variant="outline">
                          {b.visibility === "public" ? "Public" : "Private"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={b.status}
                        onValueChange={(v) =>
                          v && onStatus(b._id, v)
                        }
                      >
                        <SelectTrigger size="sm" className="w-40">
                          <SelectValue>
                            {(v: Status) => LABEL[v]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
