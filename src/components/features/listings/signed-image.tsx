import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Props = {
  storageId: Id<"_storage"> | null | undefined
  alt: string
  className?: string
  imgClassName?: string
}

export function SignedImage({ storageId, alt, className, imgClassName }: Props) {
  const url = useQuery(
    api.storage.getUrl,
    storageId ? { storageId } : "skip",
  )

  if (!storageId) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
        aria-label={alt}
      />
    )
  }

  if (url === undefined) {
    return <Skeleton className={cn(className)} />
  }

  if (url === null) {
    return (
      <div
        className={cn("bg-muted", className)}
        role="img"
        aria-label={alt}
      />
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("h-full w-full object-cover", imgClassName)}
    />
  )
}
