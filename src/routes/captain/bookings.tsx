import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Calendar, MapPin, Users } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HostGuard } from "@/components/features/captain/host-guard"
import {
  formatDateOnly,
  formatPriceCents,
  tripTypeLabel,
} from "@/lib/format"

export const Route = createFileRoute("/captain/bookings")({
  component: () => (
    <HostGuard>
      <CaptainBookings />
    </HostGuard>
  ),
})

function CaptainBookings() {
  const bookings = useQuery(api.bookings.getByHost, {})
  const confirm = useMutation(api.bookings.confirm)
  const cancel = useMutation(api.bookings.cancelByHost)
  const complete = useMutation(api.bookings.complete)

  async function onConfirm(id: Id<"bookings">) {
    try {
      await confirm({ id })
      toast.success("Booking confirmed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm")
    }
  }
  async function onCancel(id: Id<"bookings">) {
    if (!confirm) return
    if (!window.confirm("Cancel this booking?")) return
    try {
      await cancel({ id })
      toast.success("Booking cancelled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel")
    }
  }
  async function onComplete(id: Id<"bookings">) {
    try {
      await complete({ id })
      toast.success("Marked as completed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Incoming bookings
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm pending requests, cancel, or mark complete after the trip.
        </p>
      </div>

      {bookings === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No bookings yet. Once guests book your listings, they'll show up here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const guestName =
              b.guest?.firstName ?? b.guestName ?? b.guestEmail ?? "Guest"
            return (
              <Card
                key={b._id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(b.status)}>
                      {statusLabel(b.status)}
                    </Badge>
                    {b.listing ? (
                      <Badge variant="outline">
                        {tripTypeLabel(b.listing.tripType)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="font-semibold">
                    {guestName}{" "}
                    <span className="font-normal text-muted-foreground">
                      booked
                    </span>{" "}
                    {b.listing?.title ?? "your trip"}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateOnly(b.date)} · {b.startTime}–{b.endTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {b.partySize}{" "}
                      {b.partySize === 1 ? "angler" : "anglers"}
                    </span>
                    {b.listing ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {b.listing.departureCity}
                      </span>
                    ) : null}
                    <span className="font-medium text-foreground">
                      {formatPriceCents(b.totalPriceCents)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {b.listing ? (
                    <Link
                      to="/listings/$id"
                      params={{ id: b.listing._id }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      View listing
                    </Link>
                  ) : null}
                  {b.status === "pending" ? (
                    <Button size="sm" onClick={() => onConfirm(b._id)}>
                      Confirm
                    </Button>
                  ) : null}
                  {b.status === "confirmed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onComplete(b._id)}
                    >
                      Mark complete
                    </Button>
                  ) : null}
                  {b.status === "pending" || b.status === "confirmed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancel(b._id)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function statusVariant(
  s: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (s === "confirmed") return "default"
  if (s === "pending") return "secondary"
  if (s.startsWith("cancelled") || s === "no_show" || s === "disputed")
    return "destructive"
  return "outline"
}

function statusLabel(s: string) {
  if (s === "cancelled_by_guest") return "Cancelled by guest"
  if (s === "cancelled_by_host") return "Cancelled by host"
  return s.charAt(0).toUpperCase() + s.slice(1)
}
