import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Plus, Ship, Users } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HostGuard } from "@/components/features/captain/host-guard"
import { boatTypeLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/captain/boats/")({
  component: () => (
    <HostGuard>
      <BoatsPage />
    </HostGuard>
  ),
})

function BoatsPage() {
  const boats = useQuery(api.boats.getByHost, {})

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your boats</h1>
          <p className="text-sm text-muted-foreground">
            Each boat can host one or more listings.
          </p>
        </div>
        <Link
          to="/captain/boats/new"
          className={cn(buttonVariants(), "gap-1.5")}
        >
          <Plus className="h-4 w-4" />
          Add a boat
        </Link>
      </div>

      {boats === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : boats.length === 0 ? (
        <Card className="p-10 text-center">
          <Ship className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No boats yet. Add your first to start listing trips.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {boats.map((b) => (
            <Link
              key={b._id}
              to="/captain/boats/$boatId"
              params={{ boatId: b._id }}
            >
              <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/40">
                <div className="rounded-xl bg-muted p-3">
                  <Ship className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{b.name}</div>
                    {!b.isActive ? (
                      <Badge variant="outline">Inactive</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{boatTypeLabel(b.type)}</span>
                    <span>{b.lengthFeet} ft</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Up to {b.capacityGuests}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
