import { useSuspenseQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@/convex/_generated/api"
import { SharedTripCard } from "@/components/features/shared-trips/shared-trip-card"

export function SharedTripsStrip() {
  const { data: trips } = useSuspenseQuery(
    convexQuery(api.search.getOpenSharedTrips, {}),
  )

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
