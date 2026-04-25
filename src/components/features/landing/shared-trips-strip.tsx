import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { SharedTripCard } from "@/components/features/shared-trips/shared-trip-card"
import { Skeleton } from "@/components/ui/skeleton"

export function SharedTripsStrip() {
  const trips = useQuery(api.search.getOpenSharedTrips, {})

  if (trips === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (trips.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {trips.slice(0, 4).map((trip) => (
        <SharedTripCard key={trip.booking._id} trip={trip} />
      ))}
    </div>
  )
}
