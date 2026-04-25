import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { MapPin, Star, Users } from "lucide-react"
import type { MapRef } from "react-map-gl/mapbox"
import { Map, Marker, Popup } from "react-map-gl/mapbox"
import type { Doc } from "@/convex/_generated/dataModel"
import type { SharedTrip } from "@/components/features/shared-trips/shared-trip-card"
import { useHasMounted } from "@/hooks/use-has-mounted"
import { cn } from "@/lib/utils"
import { formatDateOnly, formatPriceCents } from "@/lib/format"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

type EnrichedListing = Doc<"listings"> & {
  boat?: Doc<"boats"> | null
  host?: Doc<"users"> | null
}

type Props = {
  listings: EnrichedListing[] | undefined
  sharedTrips?: SharedTrip[] | undefined
  className?: string
}

const FALLBACK = { lat: 27.9506, lng: -82.4572 }

export function ListingsMap({
  listings,
  sharedTrips,
  className,
}: Props) {
  const mounted = useHasMounted()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeSharedId, setActiveSharedId] = useState<string | null>(null)
  const mapRef = useRef<MapRef | null>(null)

  const validListings = useMemo(
    () =>
      (listings ?? []).filter(
        (l) =>
          typeof l.departureLatitude === "number" &&
          typeof l.departureLongitude === "number",
      ),
    [listings],
  )

  const validShared = useMemo(
    () =>
      (sharedTrips ?? []).filter(
        (t) =>
          typeof t.listing.departureLatitude === "number" &&
          typeof t.listing.departureLongitude === "number",
      ),
    [sharedTrips],
  )

  useEffect(() => {
    if (!mapRef.current) return
    const allLngs = [
      ...validListings.map((l) => l.departureLongitude),
      ...validShared.map((t) => t.listing.departureLongitude),
    ]
    const allLats = [
      ...validListings.map((l) => l.departureLatitude),
      ...validShared.map((t) => t.listing.departureLatitude),
    ]
    if (allLngs.length === 0) return
    if (allLngs.length === 1) {
      mapRef.current.flyTo({
        center: [allLngs[0], allLats[0]],
        zoom: 11,
      })
      return
    }
    mapRef.current.fitBounds(
      [
        [Math.min(...allLngs), Math.min(...allLats)],
        [Math.max(...allLngs), Math.max(...allLats)],
      ],
      { padding: 50, maxZoom: 11, duration: 400 },
    )
  }, [validListings, validShared])

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

  const initialCenter =
    validListings.length > 0
      ? {
          longitude: validListings[0].departureLongitude,
          latitude: validListings[0].departureLatitude,
        }
      : validShared.length > 0
        ? {
            longitude: validShared[0].listing.departureLongitude,
            latitude: validShared[0].listing.departureLatitude,
          }
        : { longitude: FALLBACK.lng, latitude: FALLBACK.lat }

  const active = validListings.find((l) => l._id === activeId)
  const activeShared = validShared.find((t) => t.booking._id === activeSharedId)

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ ...initialCenter, zoom: 10 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
      >
        {validListings.map((l) => (
          <Marker
            key={l._id}
            longitude={l.departureLongitude}
            latitude={l.departureLatitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setActiveId(l._id)
            }}
          >
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold shadow-md transition-transform hover:scale-110",
                activeId === l._id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground",
              )}
            >
              {formatPriceCents(l.priceCents, { hideCents: true })}
            </button>
          </Marker>
        ))}

        {validShared.map((t) => (
          <Marker
            key={t.booking._id}
            longitude={t.listing.departureLongitude}
            latitude={t.listing.departureLatitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setActiveSharedId(t.booking._id)
            }}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold shadow-md transition-transform hover:scale-110",
                activeSharedId === t.booking._id
                  ? "bg-primary text-primary-foreground"
                  : "border border-primary/40 bg-primary/10 text-primary",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {t.spotsRemaining} open
            </button>
          </Marker>
        ))}

        {active ? (
          <Popup
            longitude={active.departureLongitude}
            latitude={active.departureLatitude}
            anchor="bottom"
            offset={28}
            onClose={() => setActiveId(null)}
            closeOnClick={false}
            className="font-sans"
          >
            <Link
              to="/listings/$id"
              params={{ id: active._id }}
              className="block min-w-52"
            >
              <div className="text-sm font-semibold">{active.title}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {active.departureCity}, {active.departureState}
                </span>
                {active.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {(active.averageRating ?? 0).toFixed(1)}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {formatPriceCents(active.priceCents, { hideCents: true })}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  /{active.priceType === "per_person" ? "person" : "trip"}
                </span>
              </div>
            </Link>
          </Popup>
        ) : null}

        {activeShared ? (
          <Popup
            longitude={activeShared.listing.departureLongitude}
            latitude={activeShared.listing.departureLatitude}
            anchor="bottom"
            offset={28}
            onClose={() => setActiveSharedId(null)}
            closeOnClick={false}
            className="font-sans"
          >
            <Link
              to="/listings/$id"
              params={{ id: activeShared.listing._id }}
              className="block min-w-56"
            >
              <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                <Users className="h-3 w-3" />
                Shared trip
              </div>
              <div className="text-sm font-semibold">
                {activeShared.listing.title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDateOnly(activeShared.booking.date, "EEE, MMM d")} ·{" "}
                {activeShared.spotsRemaining} of{" "}
                {activeShared.spotsTotal - 1} spots open
              </div>
              <div className="mt-1 text-sm font-semibold">
                {formatPriceCents(activeShared.pricePerSpotCents, {
                  hideCents: true,
                })}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  /spot
                </span>
              </div>
            </Link>
          </Popup>
        ) : null}
      </Map>
    </div>
  )
}
