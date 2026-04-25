import { Link } from "@tanstack/react-router"
import { Calendar, MapPin, Users } from "lucide-react"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { SignedImage } from "@/components/features/listings/signed-image"
import {
  formatDateOnly,
  formatPriceCents,
  tripTypeLabel,
} from "@/lib/format"

export type SharedTrip = {
  booking: Doc<"bookings">
  listing: Doc<"listings">
  boat: Doc<"boats"> | null
  host: Doc<"users"> | null
  spotsRemaining: number
  spotsTotal: number
  pricePerSpotCents: number
}

export function SharedTripCard({ trip }: { trip: SharedTrip }) {
  const firstPhoto = trip.boat?.photos?.[0] as Id<"_storage"> | undefined

  return (
    <Link
      to="/listings/$id"
      params={{ id: trip.listing._id }}
      className="group block"
    >
      <Card className="overflow-hidden p-0 ring-2 ring-primary/40 transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <SignedImage
            storageId={firstPhoto}
            alt={trip.listing.title}
            className="absolute inset-0 h-full w-full"
            imgClassName="transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute left-3 top-3 gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Shared trip
          </Badge>
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 backdrop-blur"
          >
            {trip.spotsRemaining} of {trip.spotsTotal - 1} spots open
          </Badge>
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold">
              {trip.listing.title}
            </h3>
            <div className="shrink-0 text-base font-semibold">
              {formatPriceCents(trip.pricePerSpotCents, { hideCents: true })}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /spot
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDateOnly(trip.booking.date, "EEE, MMM d")}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {trip.listing.departureCity}, {trip.listing.departureState}
            </span>
            <Badge variant="outline" className="font-normal">
              {tripTypeLabel(trip.listing.tripType)}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
