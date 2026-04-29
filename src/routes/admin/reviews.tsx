import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { toast } from "sonner"
import { Star, Trash2 } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateOnly } from "@/lib/format"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
})

type AdminReview = FunctionReturnType<typeof api.admin.listReviews>[number]

function AdminReviews() {
  const reviews = useQuery(api.admin.listReviews, {})
  const setPublished = useMutation(api.admin.setReviewPublished)
  const setHostResponse = useMutation(api.admin.setReviewHostResponse)
  const deleteReview = useMutation(api.admin.deleteReview)

  const [activeId, setActiveId] = useState<Id<"reviews"> | null>(null)
  const active = reviews?.find((r) => r._id === activeId) ?? null

  async function onTogglePublished(id: Id<"reviews">, published: boolean) {
    try {
      await setPublished({ id, published })
      toast.success(published ? "Review published" : "Review unpublished")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  async function onSaveResponse(
    id: Id<"reviews">,
    response: string | undefined,
  ) {
    try {
      await setHostResponse({ id, response })
      toast.success(
        response && response.trim()
          ? "Captain response saved"
          : "Captain response removed",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save")
    }
  }

  async function onDelete(id: Id<"reviews">) {
    if (!window.confirm("Delete this review? This cannot be undone.")) return
    try {
      await deleteReview({ id })
      toast.success("Review deleted")
      setActiveId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Moderate guest reviews — toggle visibility, manage captain
          responses, and review trip details.
        </p>
      </div>

      {reviews === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow
                  key={r._id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setActiveId(r._id)}
                >
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {r.reviewer?.avatarUrl ? (
                          <AvatarImage
                            src={r.reviewer.avatarUrl}
                            alt={fullName(r.reviewer)}
                          />
                        ) : null}
                        <AvatarFallback>{initialsOf(r.reviewer)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium">
                          {fullName(r.reviewer) || "Anonymous"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.reviewer?.city || r.reviewer?.email || "—"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[14rem] text-sm">
                    <div className="line-clamp-1">
                      {r.listing?.title ?? "—"}
                    </div>
                    {r.tripDate ? (
                      <div className="text-xs text-muted-foreground">
                        Trip {formatDateOnly(r.tripDate, "MMM d")}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star
                        className="h-4 w-4 fill-amber-500 text-amber-500"
                        aria-hidden
                      />
                      {r.rating.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <div className="line-clamp-1 font-medium">
                      {r.title || <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {r.body}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {r.photoUrls.length}
                  </TableCell>
                  <TableCell>
                    {r.hostResponse ? (
                      <Badge variant="outline">Replied</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.isPublished ? (
                      <Badge>Published</Badge>
                    ) : (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onTogglePublished(r._id, !r.isPublished)}
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

      <Sheet
        open={!!active}
        onOpenChange={(open) => !open && setActiveId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {active ? (
            <ReviewDetail
              review={active}
              onSaveResponse={(text) => onSaveResponse(active._id, text)}
              onTogglePublished={() =>
                onTogglePublished(active._id, !active.isPublished)
              }
              onDelete={() => onDelete(active._id)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ReviewDetail({
  review,
  onSaveResponse,
  onTogglePublished,
  onDelete,
}: {
  review: AdminReview
  onSaveResponse: (text: string | undefined) => Promise<void> | void
  onTogglePublished: () => Promise<void> | void
  onDelete: () => Promise<void> | void
}) {
  const [response, setResponse] = useState(review.hostResponse ?? "")

  return (
    <>
      <SheetHeader>
        <SheetTitle>Review details</SheetTitle>
        <SheetDescription>
          {fullName(review.reviewer) || "Anonymous"} ·{" "}
          {review.listing?.title ?? "Unknown listing"}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-6 pb-2">
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            {review.reviewer?.avatarUrl ? (
              <AvatarImage
                src={review.reviewer.avatarUrl}
                alt={fullName(review.reviewer)}
              />
            ) : null}
            <AvatarFallback>{initialsOf(review.reviewer)}</AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 text-sm">
            <div className="font-medium">
              {fullName(review.reviewer) || "Anonymous"}
            </div>
            <div className="text-xs text-muted-foreground">
              {review.reviewer?.city || review.reviewer?.email || "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Submitted {formatDateOnly(toIso(review.createdAt))}
              {review.tripDate
                ? ` · trip on ${formatDateOnly(review.tripDate)}`
                : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.round(review.rating)
                    ? "fill-amber-500 text-amber-500"
                    : "text-muted-foreground/40",
                )}
                strokeWidth={i < Math.round(review.rating) ? 0 : 1.5}
                aria-hidden
              />
            ))}
            <span className="ml-1 text-sm font-medium">
              {review.rating.toFixed(1)}
            </span>
          </div>
          <CategoryGrid review={review} />
        </div>

        <div className="space-y-1">
          {review.title ? (
            <h3 className="text-sm font-semibold">{review.title}</h3>
          ) : null}
          <p className="text-sm leading-relaxed">{review.body}</p>
        </div>

        {review.photoUrls.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Photos ({review.photoUrls.length})
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {review.photoUrls.map((url, idx) => (
                <li
                  key={idx}
                  className="aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Captain response
          </div>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            placeholder="No response yet — write one on the captain's behalf, or paste theirs."
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onSaveResponse(response.trim() || undefined)}
              disabled={response.trim() === (review.hostResponse ?? "")}
            >
              Save response
            </Button>
            {review.hostResponse ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setResponse("")
                  onSaveResponse(undefined)
                }}
              >
                Clear
              </Button>
            ) : null}
            {review.hostRespondedAt ? (
              <span className="text-xs text-muted-foreground">
                Last replied{" "}
                {formatDateOnly(toIso(review.hostRespondedAt))}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <SheetFooter className="flex-row items-center justify-between gap-2 border-t">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <Button variant="outline" onClick={onTogglePublished}>
          {review.isPublished ? "Unpublish" : "Publish"}
        </Button>
      </SheetFooter>
    </>
  )
}

function CategoryGrid({ review }: { review: AdminReview }) {
  const items: Array<[string, number | undefined]> = [
    ["Fishing", review.ratingFishing],
    ["Boat", review.ratingBoat],
    ["Captain", review.ratingCaptain],
    ["Value", review.ratingValue],
  ]
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {items.map(([label, value]) => (
        <li key={label} className="flex items-center justify-between">
          <span className="text-muted-foreground">{label}</span>
          <span className="tabular-nums">
            {typeof value === "number" ? value.toFixed(1) : "—"}
          </span>
        </li>
      ))}
    </ul>
  )
}

function fullName(
  user: { firstName?: string; lastName?: string } | null | undefined,
): string {
  if (!user) return ""
  return [user.firstName, user.lastName].filter(Boolean).join(" ")
}

function initialsOf(
  user: { firstName?: string; lastName?: string } | null | undefined,
): string {
  if (!user) return "?"
  const f = user.firstName?.charAt(0) ?? ""
  const l = user.lastName?.charAt(0) ?? ""
  return (f + l).toUpperCase() || "?"
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}
