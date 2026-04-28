import { Map, Marker } from "react-map-gl/mapbox"
import { ExternalLink, MapPin } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

  // Universal deep link — Google Maps web URL opens the native app on
  // mobile when installed, and the browser otherwise. Apple-Maps users on
  // iOS still get a "Open in Apple Maps" affordance from Safari.
  const mapsUrl = label
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}+${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

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
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open in Maps"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-foreground/10 backdrop-blur transition-colors hover:bg-background"
            />
          }
        >
          <ExternalLink className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Open in Maps</TooltipContent>
      </Tooltip>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: lng, latitude: lat, zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        cooperativeGestures
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="flex flex-col items-center" title={label}>
            <div className="rounded-full bg-primary p-2 text-primary-foreground shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  )
}
