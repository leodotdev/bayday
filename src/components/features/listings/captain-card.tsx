import { CheckCircle2 } from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { SignedImage } from "@/components/features/listings/signed-image"

type Props = {
  listing: Doc<"listings">
}

/** Body content for the About-your-captain card. The parent route wraps it
 *  in the section heading + Card so all detail-page sections share one
 *  pattern. Returns null if there's nothing to show. */
export function CaptainCard({ listing }: Props) {
  if (!listing.captainIncluded && !listing.captainName) return null

  const photo = listing.captainPhoto

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
        <SignedImage
          storageId={photo}
          alt={listing.captainName ?? "Captain"}
          className="h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="font-medium">
          {listing.captainName ?? "Your captain"}
        </div>
        {listing.captainBio ? (
          <p className="text-sm text-muted-foreground">
            {listing.captainBio}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {listing.captainIncluded ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Captain included
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
