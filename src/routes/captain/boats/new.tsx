import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { HostGuard } from "@/components/features/captain/host-guard"
import { BoatForm } from "@/components/features/captain/boat-form"

export const Route = createFileRoute("/captain/boats/new")({
  component: () => (
    <HostGuard>
      <NewBoatPage />
    </HostGuard>
  ),
})

function NewBoatPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Link
        to="/captain/boats"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to boats
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Add a boat</h1>
      <BoatForm />
    </div>
  )
}
