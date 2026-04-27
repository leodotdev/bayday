import { Fish } from "lucide-react"
import { getSpeciesImage } from "@/lib/species-images"
import { cn } from "@/lib/utils"

type Props = {
  name: string
  className?: string
}

export function SpeciesCard({ name, className }: Props) {
  const src = getSpeciesImage(name)

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center p-4 text-center",
        className,
      )}
    >
      <div className="flex aspect-[3/2] w-full items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <Fish
            className="h-8 w-8 text-zinc-300 dark:text-zinc-700"
            strokeWidth={1.25}
            aria-label={name}
          />
        )}
      </div>
      <span className="text-sm">{name}</span>
    </div>
  )
}

// Responsive column count, capped at the actual number of species so a
// 3-species listing never paints empty trailing cells on a wide grid.
// Floor is 3 columns — mobile never drops below that. Listed statically
// so Tailwind keeps every variant in the build.
const COL_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-3 sm:grid-cols-4",
  5: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5",
}

export function SpeciesGrid({ species }: { species: ReadonlyArray<string> }) {
  if (species.length === 0) return null
  const cols = COL_CLASS[Math.min(species.length, 5)] ?? COL_CLASS[5]
  return (
    <div className={cn("-mb-px -mr-px grid", cols)}>
      {species.map((s) => (
        <div key={s} className="min-w-0 border-b border-r">
          <SpeciesCard name={s} />
        </div>
      ))}
    </div>
  )
}
