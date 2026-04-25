import { useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { ChevronLeft, Loader2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HostGuard } from "@/components/features/captain/host-guard"
import { toDateOnly } from "@/lib/format"

export const Route = createFileRoute("/captain/listings/$listingId/calendar")({
  component: () => (
    <HostGuard>
      <CalendarPage />
    </HostGuard>
  ),
})

function CalendarPage() {
  const { listingId } = Route.useParams()
  const id = listingId as Id<"listings">

  const listing = useQuery(api.listings.getByIdFull, { id })
  const slots = useQuery(api.availability.getCalendar, { listingId: id })
  const setSlots = useMutation(api.availability.setSlots)

  const [selected, setSelected] = useState<Date[]>([])
  const [startTime, setStartTime] = useState("07:00")
  const [endTime, setEndTime] = useState("13:00")
  const [submitting, setSubmitting] = useState(false)

  const { availableSet, bookedSet, unavailableSet } = useMemo(() => {
    const a = new Set<string>()
    const b = new Set<string>()
    const u = new Set<string>()
    for (const s of slots ?? []) {
      if (s.status === "available") a.add(s.date)
      else if (s.status === "booked") b.add(s.date)
      else if (s.status === "unavailable") u.add(s.date)
    }
    return { availableSet: a, bookedSet: b, unavailableSet: u }
  }, [slots])

  if (!listing || slots === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  async function apply(action: "available" | "unavailable") {
    if (selected.length === 0) {
      toast.error("Pick one or more dates first")
      return
    }
    setSubmitting(true)
    try {
      await setSlots({
        listingId: id,
        slots: selected.map((d) => ({
          date: toDateOnly(d),
          startTime,
          endTime,
          isAvailable: action === "available",
        })),
      })
      toast.success(
        `${selected.length} ${selected.length === 1 ? "date" : "dates"} marked ${action}`,
      )
      setSelected([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <Link
        to="/captain/listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Availability
        </h1>
        <p className="text-sm text-muted-foreground">
          {listing.title} · pick dates and apply a status. Booked dates are
          locked.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        <Card className="p-6">
          <Calendar
            mode="multiple"
            selected={selected}
            onSelect={(next) => setSelected(next ?? [])}
            disabled={(date) => {
              const key = toDateOnly(date)
              return (
                date.getTime() < new Date().setHours(0, 0, 0, 0) ||
                bookedSet.has(key)
              )
            }}
            modifiers={{
              available: (date) => availableSet.has(toDateOnly(date)),
              booked: (date) => bookedSet.has(toDateOnly(date)),
              unavailable: (date) => unavailableSet.has(toDateOnly(date)),
            }}
            modifiersClassNames={{
              available:
                "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
              booked:
                "bg-amber-100 text-amber-900 line-through dark:bg-amber-950 dark:text-amber-200",
              unavailable:
                "bg-muted text-muted-foreground line-through",
            }}
            numberOfMonths={2}
          />

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <Legend
              dot="bg-emerald-300 dark:bg-emerald-700"
              label="Available"
            />
            <Legend dot="bg-amber-300 dark:bg-amber-700" label="Booked" />
            <Legend dot="bg-muted-foreground/40" label="Unavailable" />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Apply to selected</h2>
            <p className="text-xs text-muted-foreground">
              {selected.length === 0
                ? "No dates selected"
                : `${selected.length} ${selected.length === 1 ? "date" : "dates"} selected`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.currentTarget.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.currentTarget.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={submitting || selected.length === 0}
              onClick={() => apply("available")}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Mark available
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting || selected.length === 0}
              onClick={() => apply("unavailable")}
            >
              Mark blocked
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Booked dates can't be modified — cancel or complete the booking
            first.
          </p>
        </Card>
      </div>
    </div>
  )
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
