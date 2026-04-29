import { useState } from "react"
import { useQuery } from "convex/react"
import { format, formatDistanceToNowStrict } from "date-fns"
import { BadgeCheck, Star } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateOnly } from "@/lib/format"
import { cn } from "@/lib/utils"

const CATEGORY_LABELS: Record<string, string> = {
  fishing: "Fishing",
  boat: "Boat",
  captain: "Captain",
  value: "Value",
}

const VISIBLE_LIMIT = 6

type Props = {
  listingId: Id<"listings">
}

export function ReviewsSection({ listingId }: Props) {
  const data = useQuery(api.reviews.getByListing, { listingId })
  const [expanded, setExpanded] = useState(false)

  if (data === undefined) {
    return <ReviewsSkeleton />
  }

  const { reviews, summary } = data

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <Star
          className="mx-auto h-8 w-8 text-muted-foreground/40"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium">No reviews yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to share how your trip went.
        </p>
      </div>
    )
  }

  const visible = expanded ? reviews : reviews.slice(0, VISIBLE_LIMIT)
  const hasMore = reviews.length > VISIBLE_LIMIT

  return (
    <div className="space-y-8">
      <SummaryHeader summary={summary} />

      <ul className="divide-y">
        {visible.map((review) => (
          <li key={review._id} className="py-6 first:pt-0 last:pb-0">
            <ReviewItem review={review} />
          </li>
        ))}
      </ul>

      {hasMore ? (
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? "Show fewer"
            : `Show all ${reviews.length} reviews`}
        </Button>
      ) : null}
    </div>
  )
}

function SummaryHeader({
  summary,
}: {
  summary: {
    count: number
    average: number
    categories: Record<string, number | null>
  }
}) {
  const { count, average, categories } = summary

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2">
        <Star
          className="h-6 w-6 fill-amber-500 text-amber-500"
          aria-hidden
        />
        <span className="text-3xl font-semibold tracking-tight">
          {average.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          · {count} {count === 1 ? "review" : "reviews"}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {Object.entries(categories).map(([key, value]) => (
          <li key={key} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium">{CATEGORY_LABELS[key] ?? key}</span>
              <span className="tabular-nums text-muted-foreground">
                {value !== null ? value.toFixed(1) : "—"}
              </span>
            </div>
            <span
              className="block h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden
            >
              <span
                className="block h-full rounded-full bg-foreground/80"
                style={{
                  width: value !== null ? `${(value / 5) * 100}%` : "0%",
                }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type ReviewItemProps = {
  review: {
    _id: string
    rating: number
    title?: string
    body: string
    createdAt: number
    photoUrls: string[]
    tripDate: string | null
    hostResponse?: string
    hostRespondedAt?: number
    reviewer: {
      firstName?: string
      lastName?: string
      avatarUrl?: string
      city?: string
    } | null
    host: {
      firstName?: string
      lastName?: string
      avatarUrl?: string
    } | null
  }
}

function ReviewItem({ review }: ReviewItemProps) {
  const reviewerName = displayName(review.reviewer)
  const initials = initialsOf(review.reviewer)

  return (
    <article className="space-y-3">
      <header className="flex items-start gap-3">
        <Avatar size="lg">
          {review.reviewer?.avatarUrl ? (
            <AvatarImage
              src={review.reviewer.avatarUrl}
              alt={reviewerName}
            />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold">{reviewerName}</span>
            {review.reviewer?.city ? (
              <span className="text-xs text-muted-foreground">
                {review.reviewer.city}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <Stars rating={review.rating} />
            <span>{relativeDate(review.createdAt)}</span>
            {review.tripDate ? (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck
                  className="h-3.5 w-3.5 text-foreground/70"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span>
                  Trip on {formatDateOnly(review.tripDate, "MMM d")}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="space-y-2">
        {review.title ? (
          <h3 className="text-sm font-semibold">{review.title}</h3>
        ) : null}
        <p className="text-sm leading-relaxed">{review.body}</p>
      </div>

      {review.photoUrls.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {review.photoUrls.map((url, idx) => (
            <li
              key={`${review._id}-photo-${idx}`}
              className="aspect-square overflow-hidden rounded-xl bg-muted"
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {review.hostResponse ? (
        <HostResponse
          response={review.hostResponse}
          respondedAt={review.hostRespondedAt}
          host={review.host}
        />
      ) : null}
    </article>
  )
}

function HostResponse({
  response,
  respondedAt,
  host,
}: {
  response: string
  respondedAt?: number
  host: ReviewItemProps["review"]["host"]
}) {
  const name = host
    ? [host.firstName, host.lastName].filter(Boolean).join(" ")
    : "the captain"
  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          {host?.avatarUrl ? (
            <AvatarImage src={host.avatarUrl} alt={name} />
          ) : null}
          <AvatarFallback>{initialsOf(host)}</AvatarFallback>
        </Avatar>
        <div className="text-xs">
          <span className="font-medium">Response from {name}</span>
          {respondedAt ? (
            <span className="ml-1 text-muted-foreground">
              · {relativeDate(respondedAt)}
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{response}</p>
    </div>
  )
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating)
  const label = `${rating.toFixed(1)} out of 5 stars`
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rounded
        return (
          <Star
            key={i}
            aria-hidden
            strokeWidth={filled ? 0 : 1.5}
            style={{ width: size, height: size }}
            className={cn(
              filled
                ? "fill-amber-500 text-amber-500"
                : "text-muted-foreground/40"
            )}
          />
        )
      })}
    </span>
  )
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <Skeleton className="h-8 w-40 rounded" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-11/12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function displayName(
  user:
    | {
        firstName?: string
        lastName?: string
      }
    | null
    | undefined,
): string {
  if (!user) return "Anonymous"
  const first = user.firstName?.trim()
  const last = user.lastName?.trim()
  if (first && last) return `${first} ${last.charAt(0)}.`
  return first || last || "Anonymous"
}

function initialsOf(
  user:
    | {
        firstName?: string
        lastName?: string
      }
    | null
    | undefined,
): string {
  if (!user) return "?"
  const f = user.firstName?.charAt(0) ?? ""
  const l = user.lastName?.charAt(0) ?? ""
  return (f + l).toUpperCase() || "?"
}

function relativeDate(timestamp: number): string {
  const days = Math.abs(Date.now() - timestamp) / 86400000
  if (days < 30) {
    return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true })
  }
  return format(new Date(timestamp), "MMM yyyy")
}
