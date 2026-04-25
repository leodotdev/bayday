import { useState } from "react"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAction, useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { z } from "zod"
import { Calendar as CalendarIcon, ChevronLeft, Loader2, Users } from "lucide-react"
import { format } from "date-fns"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  formatDuration,
  formatPriceCents,
  parseDateOnly,
  toDateOnly,
  tripTypeLabel,
} from "@/lib/format"
import { cn } from "@/lib/utils"

const PLATFORM_FEE_PERCENT = 10

const bookingSearchSchema = z.object({
  date: z.string().optional(),
  partySize: z.number().optional(),
})

export const Route = createFileRoute("/booking/$listingId")({
  validateSearch: bookingSearchSchema,
  component: BookingPage,
})

function Visibility({
  label,
  description,
  active,
  onClick,
}: {
  label: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "hover:bg-muted",
      )}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  )
}

function BookingPage() {
  const { listingId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { user, isAuthenticated, isLoading } = useCurrentUser()
  const data = useQuery(api.listings.getById, {
    id: listingId as Id<"listings">,
  })
  const createBooking = useMutation(api.bookings.create)
  const createAsGuest = useMutation(api.bookings.createAsGuest)
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)

  const [date, setDate] = useState<Date | undefined>(
    search.date ? parseDateOnly(search.date) : undefined,
  )
  const [partySize, setPartySize] = useState<string>(
    String(search.partySize ?? 2),
  )
  const [specialRequests, setSpecialRequests] = useState("")
  const [shareTrip, setShareTrip] = useState(false)
  const [shareVisibility, setShareVisibility] = useState<
    "private" | "public"
  >("public")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (isLoading || data === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }
  if (data === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
      </div>
    )
  }

  const listing = data
  const size = Number.parseInt(partySize, 10)

  const baseTotalCents =
    listing.priceType === "per_person"
      ? listing.priceCents * size
      : listing.priceCents
  const platformFeeCents = Math.round(
    (baseTotalCents * PLATFORM_FEE_PERCENT) / 100,
  )
  const totalCents = baseTotalCents + platformFeeCents

  const canSubmit =
    !!date &&
    size > 0 &&
    size <= listing.maxGuests &&
    (isAuthenticated || (guestName.trim() && guestEmail.trim()))

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!date) return
    const dateStr = toDateOnly(date)
    const startTime = "07:00"
    const hours = Math.round(listing.durationHours)
    const endHour = Math.min(7 + hours, 23)
    const endTime = `${String(endHour).padStart(2, "0")}:00`

    setSubmitting(true)
    try {
      if (isAuthenticated) {
        const bookingId = await createBooking({
          listingId: listing._id,
          date: dateStr,
          startTime,
          endTime,
          partySize: size,
          costSharingEnabled: shareTrip && !!listing.allowCostSharing,
          visibility:
            shareTrip && !!listing.allowCostSharing
              ? shareVisibility
              : undefined,
          specialRequests: specialRequests || undefined,
        })
        // Try to mint a Stripe Checkout session. In dev mode (no key set)
        // it returns mode: "dev" and we fall through to the confirmation
        // page with the existing direct-confirm behavior.
        try {
          const session = await createCheckoutSession({ bookingId })
          if (session.mode === "live" && session.url) {
            window.location.href = session.url
            return
          }
        } catch (err) {
          console.warn("Stripe checkout skipped:", err)
        }
        toast.success("Booking requested")
        navigate({
          to: "/booking/confirmation/$bookingId",
          params: { bookingId },
        })
      } else {
        const res = await createAsGuest({
          listingId: listing._id,
          date: dateStr,
          startTime,
          endTime,
          partySize: size,
          specialRequests: specialRequests || undefined,
          guestName,
          guestEmail,
          guestPhone: guestPhone || undefined,
        })
        toast.success("Booking requested")
        navigate({
          to: "/booking/confirmation/$bookingId",
          params: { bookingId: res.bookingId },
          search: { token: res.accessToken },
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
      <Link
        to="/listings/$id"
        params={{ id: listing._id }}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to listing
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <form onSubmit={onSubmit} className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Request your charter
          </h1>

          <Card className="space-y-4 p-6">
            <h2 className="font-semibold">Trip details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {date ? format(date, "EEE, MMM d, yyyy") : "Select a date"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={{ before: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label>Party size</Label>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-1">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Select
                    value={partySize}
                    onValueChange={(v) => setPartySize(v ?? "1")}
                  >
                    <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        {
                          length:
                            listing.maxGuests - (listing.minGuests ?? 1) + 1,
                        },
                        (_, i) => (listing.minGuests ?? 1) + i,
                      ).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "angler" : "anglers"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialRequests">Special requests (optional)</Label>
              <Textarea
                id="specialRequests"
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.currentTarget.value)}
                placeholder="Celebrating a birthday? Bringing gear? Let the captain know."
              />
            </div>
          </Card>

          {listing.allowCostSharing && isAuthenticated ? (
            <Card className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="text-base">Share this trip</Label>
                    <p className="text-sm text-muted-foreground">
                      Open empty seats so others can join and split the cost.
                    </p>
                  </div>
                </div>
                <Switch checked={shareTrip} onCheckedChange={setShareTrip} />
              </div>

              {shareTrip ? (
                <div className="space-y-2 rounded-xl border p-4">
                  <Label className="text-sm font-semibold">Who can join?</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Visibility
                      label="Friends only"
                      description="Invite by email — invite-only."
                      active={shareVisibility === "private"}
                      onClick={() => setShareVisibility("private")}
                    />
                    <Visibility
                      label="Open to public"
                      description="Anyone browsing /search can claim a spot."
                      active={shareVisibility === "public"}
                      onClick={() => setShareVisibility("public")}
                    />
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}

          {!isAuthenticated && (
            <Card className="space-y-4 p-6">
              <div>
                <h2 className="font-semibold">Guest details</h2>
                <p className="text-sm text-muted-foreground">
                  Or{" "}
                  <Link
                    to="/sign-in"
                    className="text-foreground underline"
                    search={{}}
                  >
                    sign in
                  </Link>{" "}
                  to save this booking to your account.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="guestName">Full name</Label>
                  <Input
                    id="guestName"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.currentTarget.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.currentTarget.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guestPhone">Phone (optional)</Label>
                    <Input
                      id="guestPhone"
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.currentTarget.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={!canSubmit || submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {listing.instantBook
              ? `Book for ${formatPriceCents(totalCents)}`
              : `Request to book for ${formatPriceCents(totalCents)}`}
          </Button>
          {!canSubmit && !submitting ? (
            <p className="text-center text-xs text-muted-foreground">
              {!date
                ? "Pick a date to continue"
                : "Fill in guest details to continue"}
            </p>
          ) : null}
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4 p-6">
            <div>
              <div className="text-sm text-muted-foreground">
                {tripTypeLabel(listing.tripType)} ·{" "}
                {formatDuration(listing.durationHours)}
              </div>
              <div className="text-base font-semibold">{listing.title}</div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Base {listing.priceType === "per_person" ? `× ${size}` : ""}
                </span>
                <span>{formatPriceCents(baseTotalCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Platform fee ({PLATFORM_FEE_PERCENT}%)
                </span>
                <span>{formatPriceCents(platformFeeCents)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatPriceCents(totalCents)}</span>
              </div>
            </div>

            {user ? (
              <p className="text-xs text-muted-foreground">
                Booking as {user.email}
              </p>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  )
}
