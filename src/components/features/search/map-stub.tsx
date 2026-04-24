import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { Map as MapIcon, MapPin, Star, X } from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { Card } from "@/components/ui/card"
import { formatPriceCents } from "@/lib/format"

type EnrichedListing = Doc<"listings"> & {
  boat?: Doc<"boats"> | null
  host?: Doc<"users"> | null
}

type Props = {
  listings: EnrichedListing[] | undefined
}

/**
 * Placeholder map. Real Mapbox/Leaflet integration lands in M1 (post-v1).
 * Pins are spread deterministically based on listing _id so the same listing
 * always lands at the same spot — good enough for v1 browsing affordance.
 */
export function MapStub({ listings }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const positioned = useMemo(() => {
    if (!listings) return []
    return listings.slice(0, 24).map((l) => {
      const hash = hashString(l._id)
      const x = 10 + ((hash >>> 0) % 80)
      const y = 12 + ((hash >>> 8) % 72)
      return { listing: l, x, y }
    })
  }, [listings])

  const selectedListing = listings?.find((l) => l._id === selected)

  return (
    <div className="relative h-full min-h-[480px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 via-slate-100 to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground/60">
        <div className="flex items-center gap-2 text-sm">
          <MapIcon className="h-5 w-5" />
          Interactive map coming soon
        </div>
      </div>

      {positioned.map(({ listing, x, y }) => (
        <button
          key={listing._id}
          type="button"
          onClick={() => setSelected(listing._id)}
          style={{ left: `${x}%`, top: `${y}%` }}
          className="absolute -translate-x-1/2 -translate-y-full rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-110"
          aria-label={`${listing.title} — ${formatPriceCents(listing.priceCents, { hideCents: true })}`}
        >
          {formatPriceCents(listing.priceCents, { hideCents: true })}
        </button>
      ))}

      {selectedListing && (
        <Card className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 p-0">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <Link
            to="/listings/$id"
            params={{ id: selectedListing._id }}
            className="block p-4"
          >
            <div className="mb-1 text-sm font-semibold">
              {selectedListing.title}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedListing.departureCity}, {selectedListing.departureState}
              </span>
              {selectedListing.reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  {(selectedListing.averageRating ?? 0).toFixed(1)}
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-base font-semibold">
              {formatPriceCents(selectedListing.priceCents, { hideCents: true })}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /{selectedListing.priceType === "per_person" ? "person" : "trip"}
              </span>
            </div>
          </Link>
        </Card>
      )}
    </div>
  )
}

function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
