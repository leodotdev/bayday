import { Link } from "@tanstack/react-router"
import { MapPin, Star, Users } from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { FavoriteButton } from "@/components/features/listings/favorite-button"
import { SignedImage } from "@/components/features/listings/signed-image"
import { formatPriceCents, tripTypeLabel } from "@/lib/format"

type EnrichedListing = Doc<"listings"> & {
  boat?: Doc<"boats"> | null
  host?: Doc<"users"> | null
}

type Props = {
  listing: EnrichedListing
}

export function ListingCard({ listing }: Props) {
  const firstPhoto = listing.boat?.photos?.[0]

  return (
    <Link
      to="/listings/$id"
      params={{ id: listing._id }}
      className="group block"
    >
      <Card className="overflow-hidden p-0 transition-shadow hover:shadow-sm">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <SignedImage
            storageId={firstPhoto}
            alt={listing.title}
            className="absolute inset-0 h-full w-full"
            imgClassName="transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute left-3 top-3" variant="secondary">
            {tripTypeLabel(listing.tripType)}
          </Badge>
          <div
            className="absolute right-2 top-2 z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <FavoriteButton
              listingId={listing._id}
              className="h-8 w-8 bg-background/80 backdrop-blur"
            />
          </div>
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold">
              {listing.title}
            </h3>
            <div className="shrink-0 text-base font-semibold">
              {formatPriceCents(listing.priceCents, { hideCents: true })}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /{listing.priceType === "per_person" ? "person" : "trip"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.departureCity}, {listing.departureState}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              Up to {listing.maxGuests}
            </span>
            {listing.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                {(listing.averageRating ?? 0).toFixed(1)} ({listing.reviewCount})
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}
