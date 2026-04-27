import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { MapPin, Star } from "lucide-react"
import { Map as MapboxMap, Marker, Popup } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import type { Doc } from "@/convex/_generated/dataModel"
import { useHasMounted } from "@/hooks/use-has-mounted"
import { cn } from "@/lib/utils"
import { formatPriceCents } from "@/lib/format"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

type EnrichedListing = Doc<"listings"> & {
  boat?: Doc<"boats"> | null
  host?: Doc<"users"> | null
}

type Props = {
  listings: Array<EnrichedListing> | undefined
  className?: string
}

const FALLBACK = { lat: 27.9506, lng: -82.4572 }

type Pin = {
  key: string
  lat: number
  lng: number
  listing: EnrichedListing
}

export function ListingsMap({ listings, className }: Props) {
  const mounted = useHasMounted()
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const mapRef = useRef<MapRef | null>(null)

  const pins = useMemo<Array<Pin>>(() => {
    const out: Array<Pin> = []
    for (const l of listings ?? []) {
      if (
        typeof l.departureLatitude !== "number" ||
        typeof l.departureLongitude !== "number"
      ) {
        continue
      }
      out.push({
        key: `listing:${l._id}`,
        lat: l.departureLatitude,
        lng: l.departureLongitude,
        listing: l,
      })
    }
    return out
  }, [listings])

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return
    if (pins.length === 1) {
      mapRef.current.flyTo({
        center: [pins[0].lng, pins[0].lat],
        zoom: 11,
      })
      return
    }
    const lngs = pins.map((p) => p.lng)
    const lats = pins.map((p) => p.lat)
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 50, maxZoom: 11, duration: 400 },
    )
  }, [pins])

  if (!mounted || !MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-slate-100 to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
          className,
        )}
      />
    )
  }

  const initial = pins[0] ?? { lng: FALLBACK.lng, lat: FALLBACK.lat }
  const active = pins.find((p) => p.key === activeKey) ?? null

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: initial.lng,
          latitude: initial.lat,
          zoom: 10,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        cooperativeGestures
      >
        {pins.map((pin) => {
          const isActive = activeKey === pin.key
          return (
            <Marker
              key={pin.key}
              longitude={pin.lng}
              latitude={pin.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setActiveKey(pin.key)
              }}
            >
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold shadow-md transition-transform hover:scale-110",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground",
                )}
              >
                {formatPriceCents(pin.listing.priceCents, { hideCents: true })}
              </button>
            </Marker>
          )
        })}

        {active ? (
          <Popup
            longitude={active.lng}
            latitude={active.lat}
            anchor="bottom"
            offset={28}
            onClose={() => setActiveKey(null)}
            closeOnClick={false}
            className="font-sans"
          >
            <PopupContent pin={active} />
          </Popup>
        ) : null}
      </MapboxMap>
    </div>
  )
}

function PopupContent({ pin }: { pin: Pin }) {
  const listing = pin.listing
  return (
    <div className="min-w-56 space-y-2">
      <div className="text-sm font-semibold">{listing.title}</div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {listing.departureCity}, {listing.departureState}
        </span>
        {listing.reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-current" />
            {(listing.averageRating ?? 0).toFixed(1)}
          </span>
        ) : null}
      </div>
      <Link
        to="/listings/$id"
        params={{ id: listing._id }}
        className="flex items-center justify-between rounded-lg border p-2 text-xs hover:bg-muted"
      >
        <span className="font-semibold">View charter</span>
        <span className="font-medium">
          {formatPriceCents(listing.priceCents, { hideCents: true })}
          <span className="ml-1 text-muted-foreground">
            /{listing.priceType === "per_person" ? "person" : "trip"}
          </span>
        </span>
      </Link>
    </div>
  )
}
