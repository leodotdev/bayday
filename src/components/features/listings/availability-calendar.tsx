import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { addMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { toDateOnly } from "@/lib/format"

type Props = {
  listingId: Id<"listings">
}

// Two-month availability surface, Airbnb-style. Outer chevrons advance
// both months in lockstep; the DayPicker's own nav is suppressed so we
// have a single navigation point. Day cells are ~48px so the numbers
// breathe instead of huddling.
export function AvailabilityCalendar({ listingId }: Props) {
  const calendar = useQuery(api.availability.getCalendar, { listingId })
  const [month, setMonth] = useState(() => new Date())

  const disabled = useMemo(() => {
    const set = new Set<string>()
    for (const slot of calendar ?? []) {
      if (slot.status !== "available") set.add(slot.date)
    }
    return (day: Date) => {
      if (day.getTime() < new Date().setHours(0, 0, 0, 0)) return true
      return set.has(toDateOnly(day))
    }
  }, [calendar])

  if (calendar === undefined) {
    return <Skeleton className="m-6 h-72 rounded-2xl" />
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={() => setMonth((m) => addMonths(m, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Greyed-out days are unavailable
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Calendar
          month={month}
          hideNavigation
          disabled={disabled}
          showOutsideDays={false}
          className="mx-auto w-full max-w-md [--cell-size:--spacing(12)]"
          classNames={{ root: "w-full" }}
        />
        <Calendar
          month={addMonths(month, 1)}
          hideNavigation
          disabled={disabled}
          showOutsideDays={false}
          className="mx-auto hidden w-full max-w-md [--cell-size:--spacing(12)] md:block"
          classNames={{ root: "w-full" }}
        />
      </div>
    </div>
  )
}
