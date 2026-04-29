import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  Award,
  Calendar as CalendarIcon,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  TripDatePicker,
  formatTripDateLabel,
  type TripDateValue,
} from "@/components/features/search/trip-date-picker"
import { cn } from "@/lib/utils"
import {
  formatDuration,
  formatPriceCents,
  toDateOnly,
} from "@/lib/format"

type Props = {
  listing: Doc<"listings">
  // Optional controlled date — when provided the card uses the parent's
  // date state so siblings like AvailabilityCalendar can react to it.
  dateValue?: TripDateValue
  onDateChange?: (next: TripDateValue) => void
  // Optional controlled party size. Mirrors the date controls so a parent
  // can hold the value (e.g. a session-wide trip-prefs store).
  partySize?: number
  onPartySizeChange?: (next: number) => void
}

const PLATFORM_FEE_PERCENT = 10

export function BookingCard({
  listing,
  dateValue: dateValueProp,
  onDateChange,
  partySize: partySizeProp,
  onPartySizeChange,
}: Props) {
  const calendar = useQuery(api.availability.getCalendar, {
    listingId: listing._id,
  })
  const [internalDate, setInternalDate] = useState<TripDateValue>({
    mode: "single",
  })
  const dateValue = dateValueProp ?? internalDate
  const setDateValue = onDateChange ?? setInternalDate

  const minGuests = listing.minGuests ?? 1
  const clampedExternal =
    partySizeProp !== undefined
      ? Math.min(listing.maxGuests, Math.max(minGuests, partySizeProp))
      : undefined
  const [internalPartySize, setInternalPartySize] = useState<number>(
    clampedExternal ?? minGuests,
  )
  const size = clampedExternal ?? internalPartySize
  const setSize = (n: number) => {
    const clamped = Math.min(listing.maxGuests, Math.max(minGuests, n))
    if (onPartySizeChange) onPartySizeChange(clamped)
    else setInternalPartySize(clamped)
  }

  const date = dateValue.single ?? dateValue.rangeFrom

  const disabledDates = useMemo(() => {
    if (!calendar) return undefined
    const set = new Set<string>()
    for (const slot of calendar) {
      if (slot.status !== "available") set.add(slot.date)
    }
    return (day: Date) => {
      if (day.getTime() < new Date().setHours(0, 0, 0, 0)) return true
      return set.has(toDateOnly(day))
    }
  }, [calendar])

  const customPriceCents = useMemo(() => {
    if (!date || !calendar) return undefined
    const key = toDateOnly(date)
    const slot = calendar.find((s) => s.date === key)
    return slot?.customPriceCents
  }, [date, calendar])

  const basePerTrip = customPriceCents ?? listing.priceCents
  const baseTotalCents =
    listing.priceType === "per_person" ? basePerTrip * size : basePerTrip
  const platformFeeCents = Math.round(
    (baseTotalCents * PLATFORM_FEE_PERCENT) / 100,
  )
  const totalCents = baseTotalCents + platformFeeCents

  const partyOptions = Array.from(
    { length: listing.maxGuests - (listing.minGuests ?? 1) + 1 },
    (_, i) => (listing.minGuests ?? 1) + i,
  )

  const baseLabel =
    listing.priceType === "per_person" && size > 1
      ? `${formatPriceCents(basePerTrip, { hideCents: true })} × ${size} anglers`
      : "Charter price"

  return (
    <Card className="space-y-3 p-6">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">
          {formatPriceCents(listing.priceCents, { hideCents: true })}
        </span>
        <span className="text-sm text-muted-foreground">
          /{listing.priceType === "per_person" ? "person" : "trip"}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {formatDuration(listing.durationHours)}
        </span>
      </div>

      <div className="space-y-2">
        <Popover>
          <PopoverTrigger
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {formatTripDateLabel(dateValue) ?? "Select a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <TripDatePicker
              value={dateValue}
              onChange={setDateValue}
              disabled={disabledDates}
            />
          </PopoverContent>
        </Popover>

        {partyOptions.length > 1 ? (
          <Popover>
            <PopoverTrigger
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm",
              )}
            >
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {size} {size === 1 ? "angler" : "anglers"}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <PartyStepper
                value={size}
                min={minGuests}
                max={listing.maxGuests}
                onChange={setSize}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {partyOptions[0] === 1
                ? "Private charter · 1 angler"
                : `Fixed party of ${partyOptions[0]} anglers`}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{baseLabel}</span>
          <span>{formatPriceCents(baseTotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Service fee</span>
          <span>{formatPriceCents(platformFeeCents)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-base font-semibold">
          <span>Total</span>
          <span>{formatPriceCents(totalCents)}</span>
        </div>
      </div>

      {date ? (
        <Link
          to="/booking/$listingId"
          params={{ listingId: listing._id }}
          search={{
            date: toDateOnly(date),
            partySize: size,
          }}
          className={cn(buttonVariants({ size: "lg" }), "w-full rounded-xl")}
        >
          {listing.instantBook ? "Book instantly" : "Book"}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full rounded-xl border-dashed text-muted-foreground hover:bg-transparent",
          )}
        >
          Add dates to see your total
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
        <TrustItem
          icon={
            <CalendarIcon
              className="h-5 w-5"
              strokeWidth={1.5}
              aria-hidden
            />
          }
          title="Free cancellation"
          subtitle="Up to 7 days"
        />
        <TrustItem
          icon={
            <ShieldCheck
              className="h-5 w-5"
              strokeWidth={1.5}
              aria-hidden
            />
          }
          title="Best-price guarantee"
          subtitle="We'll match it"
        />
        <TrustItem
          icon={
            <Award className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          }
          title="Verified captain"
          subtitle="USCG licensed"
        />
      </div>
    </Card>
  )
}

function PartyStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">Anglers</div>
        <div className="text-xs text-muted-foreground">
          {min === max ? `${min} only` : `${min}–${max} guests`}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Fewer anglers"
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          aria-live="polite"
          className="w-8 text-center text-sm tabular-nums"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="More anglers"
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-muted-foreground">
      <div className="text-muted-foreground/60">{icon}</div>
      <div className="font-medium text-foreground">{title}</div>
      <div>{subtitle}</div>
    </div>
  )
}
