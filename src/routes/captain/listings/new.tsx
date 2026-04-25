import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { HostGuard } from "@/components/features/captain/host-guard"
import { ListingForm } from "@/components/features/captain/listing-form"

export const Route = createFileRoute("/captain/listings/new")({
  component: () => (
    <HostGuard>
      <NewListingPage />
    </HostGuard>
  ),
})

function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Link
        to="/captain/listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to listings
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">New listing</h1>
      <p className="text-sm text-muted-foreground">
        Saved as a draft. Publish from the listings page when ready.
      </p>
      <ListingForm />
    </div>
  )
}
