import { useSuspenseQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@/convex/_generated/api"
import { ListingCard } from "@/components/features/listings/listing-card"
import { SharedTripCard } from "@/components/features/shared-trips/shared-trip-card"

export function FeaturedChartersStrip() {
  const { data: trending } = useSuspenseQuery(
    convexQuery(api.search.getTrending, {}),
  )
  const { data: shared } = useSuspenseQuery(
    convexQuery(api.search.getOpenSharedTrips, {}),
  )

  const all = [
    ...shared.slice(0, 2).map((trip) => ({ kind: "shared" as const, trip })),
    ...trending.slice(0, 4).map((listing) => ({
      kind: "listing" as const,
      listing,
    })),
  ].slice(0, 4)

  if (all.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trips published yet.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {all.map((item) =>
        item.kind === "shared" ? (
          <SharedTripCard key={item.trip.booking._id} trip={item.trip} />
        ) : (
          <ListingCard key={item.listing._id} listing={item.listing} />
        ),
      )}
    </div>
  )
}
