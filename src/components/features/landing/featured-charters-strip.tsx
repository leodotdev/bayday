import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ListingCard } from "@/components/features/listings/listing-card"
import { Skeleton } from "@/components/ui/skeleton"

export function FeaturedChartersStrip() {
  const trending = useQuery(api.search.getTrending, {})

  if (trending === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (trending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No published listings yet.
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
