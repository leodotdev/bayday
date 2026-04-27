import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPriceCents, tripTypeLabel } from "@/lib/format"

type Status = "draft" | "published" | "paused" | "archived" | "rejected"

export const Route = createFileRoute("/admin/listings")({
  component: AdminListings,
})

function AdminListings() {
  const listings = useQuery(api.admin.listListings, {})
  const setStatus = useMutation(api.admin.setListingStatus)

  async function onStatus(id: Id<"listings">, status: Status) {
    try {
      await setStatus({ id, status })
      toast.success(`Status → ${status}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        <p className="text-sm text-muted-foreground">
          Override status, drill in to the public page.
        </p>
      </div>

      {listings === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>
                    <div className="font-medium">{l.title}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.host?.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.departureCity}, {l.departureState}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tripTypeLabel(l.tripType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPriceCents(l.priceCents, { hideCents: true })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={l.status}
                      onValueChange={(v) => v && onStatus(l._id, v)}
                    >
                      <SelectTrigger size="sm" className="w-32">
                        <SelectValue>
                          {(v: string) =>
                            v.charAt(0).toUpperCase() + v.slice(1)
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/listings/$id"
                      params={{ id: l._id }}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
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
