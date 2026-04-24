import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet"
import { useHasMounted } from "@/hooks/use-has-mounted"
import { cn } from "@/lib/utils"

// Default Leaflet marker icons break under bundlers because the image paths
// resolve relative to the CSS file. Rewire them to direct CDN URLs once.
function ensureDefaultIcon() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = (L.Icon.Default.prototype as any)
  if (proto._iconUrlFixed) return
  delete proto._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
  proto._iconUrlFixed = true
}

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], zoom)
  }, [map, lat, lng, zoom])
  return null
}

type Props = {
  lat: number
  lng: number
  zoom?: number
  className?: string
  label?: string
}

export function TripMap({ lat, lng, zoom = 11, className, label }: Props) {
  const mounted = useHasMounted()

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
  ensureDefaultIcon()

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} title={label} />
        <Recenter lat={lat} lng={lng} zoom={zoom} />
      </MapContainer>
    </div>
  )
}
