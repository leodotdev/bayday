import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ChevronLeft } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"
import { HostGuard } from "@/components/features/captain/host-guard"
import { ListingForm } from "@/components/features/captain/listing-form"

export const Route = createFileRoute("/captain/listings/$listingId")({
  component: () => (
    <HostGuard>
      <EditListingPage />
    </HostGuard>
  ),
})

function EditListingPage() {
  const { listingId } = Route.useParams()
  const data = useQuery(api.listings.getByIdFull, {
    id: listingId as Id<"listings">,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Link
        to="/captain/listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to listings
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Edit listing</h1>
      {data === undefined ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : data === null ? (
        <p className="text-sm text-muted-foreground">Listing not found.</p>
      ) : (
        <ListingForm listing={data} />
      )}
    </div>
  )
}
