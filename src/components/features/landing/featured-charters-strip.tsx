import { useSuspenseQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@/convex/_generated/api"
import { ListingCard } from "@/components/features/listings/listing-card"

export function FeaturedChartersStrip() {
  const { data: trending } = useSuspenseQuery(
    convexQuery(api.search.getTrending, {}),
  )

  if (trending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trips published yet.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {trending.slice(0, 4).map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  )
}
