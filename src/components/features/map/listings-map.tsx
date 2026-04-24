import { useEffect, useMemo, useState } from "react"
import L from "leaflet"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import { Link } from "@tanstack/react-router"
import { MapPin, Star } from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { useHasMounted } from "@/hooks/use-has-mounted"
import { cn } from "@/lib/utils"
import { formatPriceCents } from "@/lib/format"

type EnrichedListing = Doc<"listings"> & {
  boat?: Doc<"boats"> | null
  host?: Doc<"users"> | null
}

type Props = {
  listings: EnrichedListing[] | undefined
  className?: string
}

function FitBounds({ listings }: { listings: EnrichedListing[] }) {
  const map = useMap()
  useEffect(() => {
    if (listings.length === 0) return
    const bounds = L.latLngBounds(
      listings.map((l) => [l.departureLatitude, l.departureLongitude]),
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 })
  }, [map, listings])
  return null
}

function priceIcon(label: string, active: boolean) {
  const bg = active ? "var(--primary)" : "white"
  const fg = active ? "var(--primary-foreground)" : "#0f172a"
  const border = active ? "var(--primary)" : "#cbd5e1"
  return L.divIcon({
    className: "!bg-transparent !border-0",
    html: `<div style="background:${bg};color:${fg};border:1px solid ${border};border-radius:9999px;padding:4px 10px;font-size:13px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.15);white-space:nowrap;transform:translate(-50%,-100%)">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// Default center: US east coast / Florida area
const FALLBACK = { lat: 27.9506, lng: -82.4572 }

export function ListingsMap({ listings, className }: Props) {
  const mounted = useHasMounted()
  const [activeId, setActiveId] = useState<string | null>(null)

  const validListings = useMemo(
    () =>
      (listings ?? []).filter(
        (l) =>
          typeof l.departureLatitude === "number" &&
          typeof l.departureLongitude === "number",
      ),
    [listings],
  )

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-slate-100 to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
          className,
        )}
      />
    )
  }

  const center =
    validListings.length > 0
      ? ([validListings[0].departureLatitude, validListings[0].departureLongitude] as [
          number,
          number,
        ])
      : ([FALLBACK.lat, FALLBACK.lng] as [number, number])

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <MapContainer
        center={center}
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validListings.map((l) => (
          <Marker
            key={l._id}
            position={[l.departureLatitude, l.departureLongitude]}
            icon={priceIcon(
              formatPriceCents(l.priceCents, { hideCents: true }),
              activeId === l._id,
            )}
            eventHandlers={{
              click: () => setActiveId(l._id),
            }}
          >
            <Popup>
              <Link
                to="/listings/$id"
                params={{ id: l._id }}
                className="block min-w-52"
              >
                <div className="text-sm font-semibold">{l.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {l.departureCity}, {l.departureState}
                  </span>
                  {l.reviewCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {(l.averageRating ?? 0).toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {formatPriceCents(l.priceCents, { hideCents: true })}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    /{l.priceType === "per_person" ? "person" : "trip"}
                  </span>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
        <FitBounds listings={validListings} />
      </MapContainer>
    </div>
  )
}
