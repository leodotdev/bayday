import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { MapPin, Star } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SignedImage } from "@/components/features/listings/signed-image"
import { ListingsMap } from "@/components/features/map/listings-map"
import { formatPriceCents } from "@/lib/format"
import { cn } from "@/lib/utils"

// v1 center: Tampa Bay. Real geolocation lands in P2.
const FALLBACK_CENTER = { lat: 27.9506, lng: -82.4572, label: "Tampa Bay, FL" }

export function NearbyBoats() {
  const nearby = useQuery(api.search.getNearby, {
    latitude: FALLBACK_CENTER.lat,
    longitude: FALLBACK_CENTER.lng,
    radiusMiles: 200,
  })

  return (
    <Card className="grid gap-0 overflow-hidden p-0 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold">Find Boats Near You</h2>
          <p className="text-sm text-muted-foreground">
            Top-rated charters within reach of {FALLBACK_CENTER.label}.
          </p>
        </div>

        {nearby === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : nearby.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No listings found in this area.
          </p>
        ) : (
          <ul className="space-y-3">
            {nearby.slice(0, 3).map((listing) => (
              <li key={listing._id}>
                <Link
                  to="/listings/$id"
                  params={{ id: listing._id }}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <SignedImage
                      storageId={
                        listing.boat?.photos?.[0]
                      }
                      alt={listing.title}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-medium">
                      {listing.title}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {listing.departureCity}
                      </span>
                      {listing.reviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current" />
                          {(listing.averageRating ?? 0).toFixed(1)}
                        </span>
                      ) : null}
                      <span>{listing.distanceMiles.toFixed(1)} mi</span>
                    </div>
                  </div>
                  <div className="text-base font-semibold">
                    {formatPriceCents(listing.priceCents, { hideCents: true })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/search"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          View all boats
        </Link>
      </div>

      <ListingsMap
        listings={nearby}
        className="min-h-[320px] rounded-none"
      />
    </Card>
  )
}
