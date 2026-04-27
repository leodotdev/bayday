import { useState } from "react"
import { useAction, useMutation } from "convex/react"
import { toast } from "sonner"
import { Calendar as CalendarIcon, CheckCircle2, Loader2, Users } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatDateOnly, formatPriceCents } from "@/lib/format"

type Props = {
  bookingId: Id<"bookings">
  booking: Doc<"bookings">
}

export function TripSummaryCard({ bookingId, booking }: Props) {
  const { user, isAuthenticated } = useCurrentUser()
  const checkout = useAction(api.stripe.createCheckoutSession)
  const markBookingPaid = useMutation(api.bookings.markPaid)
  const cancel = useMutation(api.bookings.cancelByGuest)

  const [busy, setBusy] = useState(false)

  const isPrimary = isAuthenticated && user?._id === booking.guestId
  const platformFeeCents = booking.platformFeeCents ?? 0
  const baseSubtotalCents = booking.totalPriceCents - platformFeeCents
  const isCancellable =
    booking.status === "pending" || booking.status === "confirmed"
  const paid = !!booking.paidAt

  async function onCheckout() {
    setBusy(true)
    try {
      const session = await checkout({ bookingId })
      if (session.mode === "live" && session.url) {
        window.location.href = session.url
        return
      }
      // Dev mode (no STRIPE_SECRET_KEY) — flip the demo paid flag so the
      // card shows the success state.
      await markBookingPaid({ id: bookingId })
      toast.success("Marked paid (dev mode)")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start checkout",
      )
    } finally {
      setBusy(false)
    }
  }

  async function onCancel() {
    if (!window.confirm("Cancel this trip?")) return
    setBusy(true)
    try {
      await cancel({ id: bookingId })
      toast.success("Trip cancelled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">
            {formatPriceCents(booking.totalPriceCents, { hideCents: true })}
          </span>
          <span className="text-sm text-muted-foreground">total</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4" />
            {formatDateOnly(booking.date, "EEE, MMM d")} · {booking.startTime}–
            {booking.endTime}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {booking.partySize}{" "}
            {booking.partySize === 1 ? "angler" : "anglers"}
          </span>
        </div>
      </div>

      <dl className="space-y-2 border-t pt-4 text-sm">
        <Row
          label={`Base · ${booking.partySize} ${booking.partySize === 1 ? "angler" : "anglers"}`}
          value={formatPriceCents(baseSubtotalCents)}
        />
        <Row
          label="Platform fee"
          value={formatPriceCents(platformFeeCents)}
        />
        <div className="mt-2 flex items-baseline justify-between border-t pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-lg font-semibold">
            {formatPriceCents(booking.totalPriceCents)}
          </dd>
        </div>
      </dl>

      {isPrimary ? (
        paid ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            You've paid {formatPriceCents(booking.totalPriceCents)}
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full rounded-xl"
            disabled={busy}
            onClick={onCheckout}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Checkout · {formatPriceCents(booking.totalPriceCents, { hideCents: true })}
          </Button>
        )
      ) : (
        <p className="text-xs text-muted-foreground">
          This trip is reserved by the booker.
        </p>
      )}

      {isPrimary && isCancellable ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel trip
        </Button>
      ) : null}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
