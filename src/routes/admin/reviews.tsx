import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Star } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
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

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
})

function AdminReviews() {
  const reviews = useQuery(api.admin.listReviews, {})
  const setPublished = useMutation(api.admin.setReviewPublished)

  async function onToggle(id: Id<"reviews">, published: boolean) {
    try {
      await setPublished({ id, published })
      toast.success(published ? "Review published" : "Review unpublished")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Moderate guest reviews — toggle visibility on the public listing.
        </p>
      </div>

      {reviews === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="text-sm">
                    {r.listing?.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.reviewer?.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star className="h-4 w-4 fill-current" />
                      {r.rating.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <div className="font-medium">{r.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {r.body}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.isPublished ? (
                      <Badge>Published</Badge>
                    ) : (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggle(r._id, !r.isPublished)}
                    >
                      {r.isPublished ? "Hide" : "Publish"}
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
