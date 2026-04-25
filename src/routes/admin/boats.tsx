import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { boatTypeLabel } from "@/lib/format"

export const Route = createFileRoute("/admin/boats")({
  component: AdminBoats,
})

function AdminBoats() {
  const boats = useQuery(api.admin.listBoats, {})
  const setActive = useMutation(api.admin.setBoatActive)

  async function onToggle(id: Id<"boats">, active: boolean) {
    try {
      await setActive({ id, active })
      toast.success(active ? "Boat activated" : "Boat deactivated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Boats</h1>
        <p className="text-sm text-muted-foreground">
          Every boat across the fleet.
        </p>
      </div>

      {boats === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boats.map((b) => (
                <TableRow key={b._id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.host?.email ?? "—"}
                  </TableCell>
                  <TableCell>{boatTypeLabel(b.type)}</TableCell>
                  <TableCell>{b.lengthFeet} ft</TableCell>
                  <TableCell>Up to {b.capacityGuests}</TableCell>
                  <TableCell>
                    {b.isActive ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggle(b._id, !b.isActive)}
                    >
                      {b.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
