import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { SignedImage } from "@/components/features/listings/signed-image"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  photos: Array<Id<"_storage">>
}

export function ListingGallery({ title, photos }: Props) {
  const [viewportRef, embla] = useEmblaCarousel({ loop: photos.length > 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!embla) return
    const handler = () => setSelectedIndex(embla.selectedScrollSnap())
    embla.on("select", handler)
    return () => {
      embla.off("select", handler)
    }
  }, [embla])

  if (photos.length === 0) {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <div ref={viewportRef} className="overflow-hidden">
          <div className="flex">
            {photos.map((p, i) => (
              <div key={`${p}-${i}`} className="relative w-full shrink-0">
                <div className="aspect-[16/10] w-full">
                  <SignedImage
                    storageId={p}
                    alt={`${title} photo ${i + 1}`}
                    className="absolute inset-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => embla?.scrollPrev()}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow hover:bg-background"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => embla?.scrollNext()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow hover:bg-background"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
              {selectedIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={`thumb-${p}-${i}`}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-transparent transition-all",
                i === selectedIndex && "ring-foreground",
              )}
              aria-label={`Show photo ${i + 1}`}
            >
              <SignedImage
                storageId={p}
                alt=""
                className="absolute inset-0"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
