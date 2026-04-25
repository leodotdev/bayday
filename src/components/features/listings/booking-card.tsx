import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  Award,
  Calendar as CalendarIcon,
  ShieldCheck,
  Users,
} from "lucide-react"
import { format } from "date-fns"
import type { Doc } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  formatDuration,
  formatPriceCents,
  toDateOnly,
} from "@/lib/format"

type Props = {
  listing: Doc<"listings">
}

const PLATFORM_FEE_PERCENT = 10

export function BookingCard({ listing }: Props) {
  const calendar = useQuery(api.availability.getCalendar, {
    listingId: listing._id,
  })
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [partySize, setPartySize] = useState<string>(
    String(listing.minGuests ?? 1),
  )

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
  const size = Number.parseInt(partySize, 10)
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

  return (
    <Card className="space-y-4 p-6">
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
            {date ? format(date, "EEE, MMM d, yyyy") : "Select a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={disabledDates}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 rounded-xl border px-3 py-1 text-sm">
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Select
            value={partySize}
            onValueChange={(v) => setPartySize(v ?? "1")}
          >
            <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {partyOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n === 1 ? "angler" : "anglers"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Base {listing.priceType === "per_person" ? `× ${size}` : ""}
          </span>
          <span>{formatPriceCents(baseTotalCents)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Platform fee ({PLATFORM_FEE_PERCENT}%)
          </span>
          <span>{formatPriceCents(platformFeeCents)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between font-semibold">
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
          {listing.instantBook ? "Book instantly" : "Request to Book"}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full rounded-xl opacity-60",
          )}
        >
          Select a date to continue
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs text-muted-foreground">
        <TrustItem
          icon={<CalendarIcon className="h-5 w-5" />}
          title="Free Cancellation"
          subtitle="7 days prior"
        />
        <TrustItem
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Best Price"
          subtitle="Guarantee"
        />
        <TrustItem
          icon={<Award className="h-5 w-5" />}
          title="Trusted"
          subtitle="Local Captain"
        />
      </div>
    </Card>
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
    <div className="flex flex-col items-center gap-1">
      <div className="text-foreground/80">{icon}</div>
      <div className="font-medium text-foreground">{title}</div>
      <div>{subtitle}</div>
    </div>
  )
}
