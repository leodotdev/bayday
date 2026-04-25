import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ChevronLeft } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"
import { HostGuard } from "@/components/features/captain/host-guard"
import { BoatForm } from "@/components/features/captain/boat-form"

export const Route = createFileRoute("/captain/boats/$boatId")({
  component: () => (
    <HostGuard>
      <EditBoatPage />
    </HostGuard>
  ),
})

function EditBoatPage() {
  const { boatId } = Route.useParams()
  const boat = useQuery(api.boats.getById, {
    id: boatId as Id<"boats">,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Link
        to="/captain/boats"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to boats
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Edit boat</h1>
      {boat === undefined ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : boat === null ? (
        <p className="text-sm text-muted-foreground">Boat not found.</p>
      ) : (
        <BoatForm boat={boat} />
      )}
    </div>
  )
}
