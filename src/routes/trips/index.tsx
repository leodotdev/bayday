import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Calendar as CalendarIcon, MapPin, Users } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"
import { formatDateOnly, formatPriceCents, tripTypeLabel } from "@/lib/format"

export const Route = createFileRoute("/trips/")({
  component: TripsPage,
})

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled_by_guest: "destructive",
  cancelled_by_host: "destructive",
  no_show: "destructive",
  disputed: "destructive",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled_by_guest: "Cancelled",
  cancelled_by_host: "Cancelled by host",
  no_show: "No show",
  disputed: "Disputed",
}

function TripsPage() {
  const { isAuthenticated, isLoading } = useCurrentUser()
  const bookings = useQuery(
    api.bookings.getByGuest,
    isAuthenticated ? {} : "skip",
  )
  const cancel = useMutation(api.bookings.cancelByGuest)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />
  }

  async function onCancel(bookingId: string) {
    if (!confirm("Cancel this trip?")) return
    try {
      await cancel({ id: bookingId as Parameters<typeof cancel>[0]["id"] })
      toast.success("Booking cancelled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your trips</h1>

      {bookings === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You haven't booked any trips yet.
          </p>
          <div className="mt-4">
            <Link to="/search" className={cn(buttonVariants())}>
              Browse charters
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const listing = b.listing
            const boat = b.boat
            const active =
              b.status !== "cancelled_by_guest" &&
              b.status !== "cancelled_by_host" &&
              b.status !== "completed"
            return (
              <Card key={b._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {/* first boat photo via SignedImage could go here; left plain for now */}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[b.status] ?? "outline"}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </Badge>
                    {listing ? (
                      <Badge variant="outline">
                        {tripTypeLabel(listing.tripType)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="font-semibold">
                    {listing?.title ?? boat?.name ?? "Booking"}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDateOnly(b.date)} · {b.startTime}–{b.endTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {b.partySize} {b.partySize === 1 ? "angler" : "anglers"}
                    </span>
                    {listing ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {listing.departureCity}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-medium">
                    {formatPriceCents(b.totalPriceCents)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    to="/trips/$bookingId"
                    params={{ bookingId: b._id }}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Manage trip
                  </Link>
                  {b.status === "completed" ? (
                    <Link
                      to="/trips/$bookingId/review"
                      params={{ bookingId: b._id }}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Leave a review
                    </Link>
                  ) : null}
                  {active ? (
                    <Button
                      variant="ghost"
                      size="sm"
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
