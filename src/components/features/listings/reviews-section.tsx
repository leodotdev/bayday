import { useQuery } from "convex/react"
import { Star } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { formatDateOnly } from "@/lib/format"

type Props = {
  listingId: Id<"listings">
}

export function ReviewsSection({ listingId }: Props) {
  const reviews = useQuery(api.reviews.getByListing, { listingId })

  if (reviews === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No reviews yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, 6).map((review) => {
        const createdAt = new Date(review.createdAt)
          .toISOString()
          .slice(0, 10)
        return (
          <div key={review._id} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(review.rating)
                        ? "h-4 w-4 fill-current"
                        : "h-4 w-4 text-muted-foreground"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{review.title}</span>
              <span className="text-sm text-muted-foreground">
                {formatDateOnly(createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{review.body}</p>
            {review.hostResponse ? (
              <div className="ml-4 border-l-2 border-muted pl-3 text-sm">
                <span className="font-medium">Captain response:</span>{" "}
                <span className="text-muted-foreground">{review.hostResponse}</span>
              </div>
            ) : null}
            <Separator />
          </div>
        )
      })}
    </div>
  )
}
