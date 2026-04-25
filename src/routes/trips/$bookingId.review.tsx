import { useState } from "react"
import {
  createFileRoute,
  Link,
  Navigate,
  useRouter,
} from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { ChevronLeft, Loader2, Star } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/trips/$bookingId/review")({
  component: ReviewPage,
})

const CRITERIA = [
  { key: "ratingFishing" as const, label: "Fishing" },
  { key: "ratingBoat" as const, label: "Boat" },
  { key: "ratingCaptain" as const, label: "Captain" },
  { key: "ratingValue" as const, label: "Value" },
]

function ReviewPage() {
  const { bookingId } = Route.useParams()
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useCurrentUser()
  const data = useQuery(api.bookings.getById, {
    id: bookingId as Id<"bookings">,
  })
  const existing = useQuery(api.reviews.getByBooking, {
    bookingId: bookingId as Id<"bookings">,
  })
  const create = useMutation(api.reviews.create)

  const [rating, setRating] = useState(0)
  const [criteria, setCriteria] = useState<{
    ratingFishing: number
    ratingBoat: number
    ratingCaptain: number
    ratingValue: number
  }>({
    ratingFishing: 0,
    ratingBoat: 0,
    ratingCaptain: 0,
    ratingValue: 0,
  })
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (isLoading || data === undefined || existing === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" />
  if (data === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Trip not found</h1>
      </div>
    )
  }

  const booking = data
  const listing = data.listing
  const isPrimary = user?._id && booking.guestId === user._id
  const isCompleted = booking.status === "completed"

  if (!isPrimary) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not your trip</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only the booking primary can leave a review.
        </p>
      </div>
    )
  }
  if (!isCompleted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can review this trip after the captain marks it complete.
        </p>
      </div>
    )
  }
  if (existing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Review already submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can only review a trip once.
        </p>
        {listing ? (
          <Link
            to="/listings/$id"
            params={{ id: listing._id }}
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            View listing →
          </Link>
        ) : null}
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Pick an overall rating")
      return
    }
    if (!title.trim() || !body.trim()) {
      toast.error("Title and review body are required")
      return
    }
    setSubmitting(true)
    try {
      await create({
        bookingId: bookingId as Id<"bookings">,
        rating,
        ratingFishing: criteria.ratingFishing || undefined,
        ratingBoat: criteria.ratingBoat || undefined,
        ratingCaptain: criteria.ratingCaptain || undefined,
        ratingValue: criteria.ratingValue || undefined,
        title,
        body,
      })
      toast.success("Review posted — thanks!")
      router.navigate({
        to: "/listings/$id",
        params: { id: booking.listingId },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <Link
        to="/trips"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All trips
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Review your trip
        </h1>
        {listing ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {listing.title} · {listing.departureCity}
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-4 p-6">
          <div>
            <Label className="text-base">Overall rating</Label>
            <p className="text-xs text-muted-foreground">
              Tap a star.
            </p>
          </div>
          <Stars value={rating} onChange={setRating} size="lg" />
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <Label className="text-base">By category (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Helps future anglers see what stood out.
            </p>
          </div>
          <div className="space-y-3">
            {CRITERIA.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm font-medium">{c.label}</span>
                <Stars
                  value={criteria[c.key]}
                  onChange={(v) =>
                    setCriteria((prev) => ({ ...prev, [c.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="title">Headline</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="One-line summary"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Your review</Label>
            <Textarea
              id="body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.currentTarget.value)}
              placeholder="Tell future anglers what to expect — fishing, captain, boat, value, anything."
              required
            />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.navigate({ to: "/trips" })}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Post review
          </Button>
        </div>
      </form>
    </div>
  )
}

function Stars({
  value,
  onChange,
  size = "md",
}: {
  value: number
  onChange: (next: number) => void
  size?: "md" | "lg"
}) {
  const sz = size === "lg" ? "h-8 w-8" : "h-5 w-5"
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              sz,
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  )
}
