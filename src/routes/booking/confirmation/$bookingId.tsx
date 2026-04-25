import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { z } from "zod"
import {
  Calendar as CalendarIcon,
  Check,
  MapPin,
  MessageSquare,
  Printer,
  Share2,
  Users,
} from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { TripMap } from "@/components/features/map/trip-map"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatDateOnly,
  formatDuration,
  formatPriceCents,
  tripTypeLabel,
} from "@/lib/format"

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute("/booking/confirmation/$bookingId")({
  validateSearch: searchSchema,
  component: ConfirmationPage,
})

function ConfirmationPage() {
  const { bookingId } = Route.useParams()
  const { token } = Route.useSearch()

  const authed = useQuery(
    api.bookings.getById,
    token ? "skip" : { id: bookingId as Id<"bookings"> },
  )
  const guestAccess = useQuery(
    api.bookings.getByAccessToken,
    token ? { accessToken: token } : "skip",
  )

  const data = token ? guestAccess : authed
  const createConversation = useMutation(api.conversations.createForBooking)

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }
  if (data === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Booking not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the link in your confirmation email.
        </p>
      </div>
    )
  }

  // Both getById and getByAccessToken return the booking fields spread + listing/boat/host
  const booking = data
  const { listing, boat } = data

  function onPrint() {
    window.print()
  }

  async function onShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: "My DayTrip booking", url })
        return
      } catch {
        // user cancelled or share unsupported — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Could not share")
    }
  }

  function onAddToCalendar() {
    if (!listing) return
    const start = `${booking.date.replaceAll("-", "")}T${booking.startTime.replace(":", "")}00`
    const end = `${(booking.endDate ?? booking.date).replaceAll("-", "")}T${booking.endTime.replace(":", "")}00`
    const ics =
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Daytrip//EN",
        "BEGIN:VEVENT",
        `UID:${booking._id}@daytrip`,
        `DTSTAMP:${new Date().toISOString().replaceAll("-", "").replaceAll(":", "").split(".")[0]}Z`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${listing.title}`,
        `LOCATION:${listing.departurePort}, ${listing.departureCity}, ${listing.departureState}`,
        `DESCRIPTION:DayTrip charter booking`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n") + "\r\n"
    const blob = new Blob([ics], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `daytrip-${booking._id}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onMessageCaptain() {
    if (!listing) return
    try {
      const conversationId = await createConversation({
        bookingId: booking._id,
        listingId: listing._id,
        hostId: listing.hostId,
      })
      window.location.href = `/conversation/${conversationId}`
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open chat")
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 lg:py-16">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          You're all set for your trip!
        </h1>
        <p className="text-muted-foreground">
          We've recorded your request. The captain will confirm shortly.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Confirmation #{booking._id.slice(-8).toUpperCase()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Reservation summary</h2>
          {listing ? (
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted" />
              <div>
                <div className="text-sm font-semibold">{listing.title}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {listing.departureCity}, {listing.departureState}
                </div>
              </div>
            </div>
          ) : null}

          <Separator />

          <dl className="space-y-2 text-sm">
            <Row
              icon={<CalendarIcon className="h-4 w-4" />}
              label="Date"
              value={formatDateOnly(booking.date, "EEEE, MMMM d, yyyy")}
            />
            <Row
              label="Time"
              value={`${booking.startTime} – ${booking.endTime} (${listing ? formatDuration(listing.durationHours) : ""})`}
            />
            <Row
              icon={<Users className="h-4 w-4" />}
              label="Guests"
              value={`${booking.partySize} ${booking.partySize === 1 ? "angler" : "anglers"}`}
            />
            {listing ? (
              <Row label="Trip type" value={tripTypeLabel(listing.tripType)} />
            ) : null}
            {boat ? <Row label="Boat" value={boat.name} /> : null}
          </dl>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">
              {formatPriceCents(booking.totalPriceCents)}
            </span>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Dock location</h2>
          {listing ? (
            <>
              {typeof listing.departureLatitude === "number" &&
              typeof listing.departureLongitude === "number" ? (
                <TripMap
                  lat={listing.departureLatitude}
                  lng={listing.departureLongitude}
                  label={listing.departurePort}
                  zoom={13}
                  className="h-52"
                />
              ) : null}
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <div className="font-medium">{listing.departurePort}</div>
                <div className="text-muted-foreground">
                  {listing.departureCity}, {listing.departureState}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Arrive 15–20 minutes early for check-in.
              </p>
            </>
          ) : null}
        </Card>
      </div>

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold">What's next?</div>
          <div className="text-sm text-muted-foreground">
            We're looking forward to having you on the water.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={onAddToCalendar}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Add to calendar
          </Button>
          <Button variant="outline" onClick={onShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button onClick={onMessageCaptain} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Message captain
          </Button>
        </div>
      </Card>

      {booking.costSharingEnabled ? (
        <div className="text-center">
          <Link
            to="/trips/$bookingId"
            params={{ bookingId: booking._id }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Invite friends or manage your shared trip →
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <Link
            to="/trips"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all your trips →
          </Link>
        </div>
      )}

    </div>
  )
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      {icon ? (
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
      ) : (
        <span className="w-4" />
      )}
      <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  )
}
