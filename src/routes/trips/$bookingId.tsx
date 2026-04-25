import { useState } from "react"
import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { z } from "zod"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  Copy,
  Loader2,
  Mail,
  MapPin,
  Users,
} from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  formatDateOnly,
  formatPriceCents,
  tripTypeLabel,
} from "@/lib/format"

const searchSchema = z.object({
  invite: z.string().optional(),
})

export const Route = createFileRoute("/trips/$bookingId")({
  validateSearch: searchSchema,
  component: TripDetailPage,
})

function TripDetailPage() {
  const { bookingId } = Route.useParams()
  const { invite: inviteCode } = Route.useSearch()
  const router = useRouter()
  const { user, isAuthenticated } = useCurrentUser()

  const data = useQuery(api.bookings.getById, {
    id: bookingId as Id<"bookings">,
  })
  const participants = useQuery(api.participants.getByBooking, {
    bookingId: bookingId as Id<"bookings">,
  })

  const claim = useMutation(api.participants.claimOpenSpot)
  const invite = useMutation(api.participants.invite)
  const removeP = useMutation(api.participants.remove)
  const respond = useMutation(api.participants.respondToInvite)

  const [inviteEmail, setInviteEmail] = useState("")
  const [busy, setBusy] = useState(false)

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }
  if (data === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Trip not found</h1>
      </div>
    )
  }

  const booking = data
  const listing = data.listing
  const isPrimary = isAuthenticated && user?._id === booking.guestId
  const isPublic = booking.visibility === "public"
  const isShared = !!booking.costSharingEnabled

  const totalSpots = booking.costSharingMaxSpots ?? booking.partySize
  const filled =
    participants?.filter(
      (p) => p.status === "confirmed" || p.status === "pending",
    ).length ?? 0
  const spotsRemaining = Math.max(0, totalSpots - filled - 1)
  const pricePerSpot = Math.round(
    booking.totalPriceCents / Math.max(totalSpots, 1),
  )
  const myParticipant = participants?.find(
    (p) => p.userId && user?._id && p.userId === user._id,
  )
  const inviteParticipant = inviteCode
    ? participants?.find((p) => p.inviteCode === inviteCode)
    : undefined

  async function onClaim() {
    setBusy(true)
    try {
      await claim({ bookingId: bookingId as Id<"bookings"> })
      toast.success("You're in! See you on the water.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join")
    } finally {
      setBusy(false)
    }
  }

  async function onInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!inviteEmail) return
    setBusy(true)
    try {
      const res = await invite({
        bookingId: bookingId as Id<"bookings">,
        email: inviteEmail,
      })
      const url = `${window.location.origin}/trips/${bookingId}?invite=${res.inviteCode}`
      try {
        await navigator.clipboard.writeText(url)
        toast.success("Invite link copied to clipboard")
      } catch {
        toast.success("Invite created")
      }
      setInviteEmail("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not invite")
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(participantId: Id<"bookingParticipants">) {
    if (!window.confirm("Remove this participant?")) return
    try {
      await removeP({ participantId })
      toast.success("Removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove")
    }
  }

  async function onRespond(accept: boolean) {
    if (!inviteCode) return
    try {
      await respond({ inviteCode, accept })
      toast.success(accept ? "Welcome aboard!" : "Invite declined")
      router.navigate({
        to: "/trips/$bookingId",
        params: { bookingId },
        search: {},
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not respond")
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <Link
        to="/trips"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All trips
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isShared ? (
            <Badge className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Shared trip
            </Badge>
          ) : null}
          {isShared ? (
            <Badge variant="outline">
              {isPublic ? "Open to public" : "Friends only"}
            </Badge>
          ) : null}
          {listing ? (
            <Badge variant="outline">{tripTypeLabel(listing.tripType)}</Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {listing?.title ?? "Your trip"}
        </h1>
        {listing ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {formatDateOnly(booking.date, "EEEE, MMMM d, yyyy")} ·{" "}
              {booking.startTime}–{booking.endTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.departurePort}, {listing.departureCity},{" "}
              {listing.departureState}
            </span>
          </div>
        ) : null}
      </div>

      {/* Invited via link — accept/decline */}
      {inviteParticipant && inviteParticipant.status === "pending" ? (
        <Card className="space-y-3 border-primary/40 bg-primary/5 p-6">
          <div>
            <h2 className="font-semibold">You've been invited</h2>
            <p className="text-sm text-muted-foreground">
              Accept to confirm your spot — your share is{" "}
              <span className="font-medium text-foreground">
                {formatPriceCents(inviteParticipant.shareCents || pricePerSpot)}
              </span>
              .
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onRespond(true)}>Accept invite</Button>
            <Button variant="outline" onClick={() => onRespond(false)}>
              Decline
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Public claim */}
      {isShared && isPublic && !isPrimary && !myParticipant ? (
        <Card className="space-y-3 border-primary/40 bg-primary/5 p-6">
          <div>
            <h2 className="font-semibold">Join this trip</h2>
            <p className="text-sm text-muted-foreground">
              {spotsRemaining} of {totalSpots - 1} spots open · split with the
              group.
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">
              {formatPriceCents(pricePerSpot, { hideCents: true })}
            </span>
            <span className="text-sm text-muted-foreground">per spot</span>
          </div>
          {!isAuthenticated ? (
            <Link
              to="/sign-in"
              search={{ redirect: `/trips/${bookingId}` }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Sign in to claim a spot →
            </Link>
          ) : spotsRemaining > 0 ? (
            <Button size="lg" onClick={onClaim} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Claim a spot
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              This trip is full. Check back if a spot opens up.
            </p>
          )}
        </Card>
      ) : null}

      {/* Already a participant */}
      {myParticipant && myParticipant.status === "confirmed" ? (
        <Card className="border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <div className="font-semibold">You're confirmed for this trip</div>
          <p className="text-sm opacity-80">
            Your share is{" "}
            {formatPriceCents(myParticipant.shareCents || pricePerSpot)}.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3 p-6">
          <h2 className="font-semibold">Trip summary</h2>
          <Separator />
          <Row label="Date" value={formatDateOnly(booking.date)} />
          <Row label="Time" value={`${booking.startTime}–${booking.endTime}`} />
          <Row
            label="Total cost"
            value={formatPriceCents(booking.totalPriceCents)}
          />
          {isShared ? (
            <Row
              label="Per spot"
              value={formatPriceCents(pricePerSpot)}
            />
          ) : null}
        </Card>

        {isShared ? (
          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Riders</h2>
              <span className="text-sm text-muted-foreground">
                {filled + 1} of {totalSpots}
              </span>
            </div>
            <Separator />
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {booking.guestName ?? "Primary booker"}
                </span>
                <Badge variant="secondary">Organizer</Badge>
              </li>
              {(participants ?? [])
                .filter((p) => p.status !== "declined")
                .map((p) => (
                  <li
                    key={p._id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{p.email ?? "Rider"}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          p.status === "confirmed" ? "default" : "outline"
                        }
                      >
                        {p.status}
                      </Badge>
                      {isPrimary ? (
                        <button
                          type="button"
                          onClick={() => onRemove(p._id)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              {Array.from({ length: spotsRemaining }).map((_, i) => (
                <li
                  key={`open-${i}`}
                  className="flex items-center justify-between gap-2 text-muted-foreground"
                >
                  <span>Open spot</span>
                  {isPublic ? (
                    <Badge variant="outline">Open</Badge>
                  ) : (
                    <Badge variant="outline">Waiting on invite</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      {isPrimary && isShared ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Invite friends</h2>
            <p className="text-sm text-muted-foreground">
              Send a private invite link. They'll see "Accept invite" when
              they open it.
            </p>
          </div>
          <form onSubmit={onInvite} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.currentTarget.value)}
            />
            <Button type="submit" disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <Mail className="h-4 w-4" />
              )}
              Send invite
            </Button>
          </form>
          {isPublic ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              onClick={async () => {
                const url = `${window.location.origin}/trips/${bookingId}`
                try {
                  await navigator.clipboard.writeText(url)
                  toast.success("Public link copied")
                } catch {
                  toast.error("Could not copy")
                }
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy public trip link
            </button>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

