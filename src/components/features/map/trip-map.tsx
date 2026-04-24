import { Map, Marker } from "react-map-gl/mapbox"
import { MapPin } from "lucide-react"
import { useHasMounted } from "@/hooks/use-has-mounted"
import { cn } from "@/lib/utils"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

type Props = {
  lat: number
  lng: number
  zoom?: number
  className?: string
  label?: string
}

export function TripMap({ lat, lng, zoom = 11, className, label }: Props) {
  const mounted = useHasMounted()

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

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: lng, latitude: lat, zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div
            className="flex flex-col items-center"
            title={label}
          >
            <div className="rounded-full bg-primary p-2 text-primary-foreground shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  )
}
