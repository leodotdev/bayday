import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import {
  Anchor,
  CalendarDays,
  CheckCircle2,
  PauseCircle,
  Pencil,
  Plus,
  Users,
} from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HostGuard } from "@/components/features/captain/host-guard"
import { cn } from "@/lib/utils"
import { formatPriceCents, tripTypeLabel } from "@/lib/format"

export const Route = createFileRoute("/captain/listings/")({
  component: () => (
    <HostGuard>
      <CaptainListings />
    </HostGuard>
  ),
})

function CaptainListings() {
  const listings = useQuery(api.listings.getByHost, {})
  const publish = useMutation(api.listings.publish)
  const pause = useMutation(api.listings.pause)

  async function onPublish(id: Id<"listings">) {
    try {
      await publish({ id })
      toast.success("Listing published")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish")
    }
  }

  async function onPause(id: Id<"listings">) {
    try {
      await pause({ id })
      toast.success("Listing paused")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not pause")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your listings
          </h1>
          <p className="text-sm text-muted-foreground">
            Charters you offer guests. Each must reference one of your boats.
          </p>
        </div>
        <Link
          to="/captain/listings/new"
          className={cn(buttonVariants(), "gap-1.5")}
        >
          <Plus className="h-4 w-4" />
          New listing
        </Link>
      </div>

      {listings === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="p-10 text-center">
          <Anchor className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No listings yet. Create your first to start taking bookings.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <Card
              key={l._id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(l.status)}>
                    {statusLabel(l.status)}
                  </Badge>
                  <Badge variant="outline">{tripTypeLabel(l.tripType)}</Badge>
                  {l.allowCostSharing ? (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      Shared trips
                    </Badge>
                  ) : null}
                </div>
                <div className="font-semibold">{l.title}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{l.departureCity}, {l.departureState}</span>
                  <span>
                    {formatPriceCents(l.priceCents, { hideCents: true })}
                    {" "}/{l.priceType === "per_person" ? "person" : "trip"}
                  </span>
                  <span>{l.durationHours}h · up to {l.maxGuests}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/captain/listings/$listingId/calendar"
                  params={{ listingId: l._id }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Calendar
                </Link>
                <Link
                  to="/captain/listings/$listingId"
                  params={{ listingId: l._id }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
                {l.status === "published" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPause(l._id)}
                    className="gap-1.5"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onPublish(l._id)}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Publish
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function statusVariant(
  s: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (s === "published") return "default"
  if (s === "paused") return "secondary"
  if (s === "rejected") return "destructive"
  return "outline"
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
