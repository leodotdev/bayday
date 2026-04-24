import { format, parseISO } from "date-fns"

export function formatPriceCents(cents: number, options?: { hideCents?: boolean }) {
  const dollars = cents / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.hideCents && dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars)
}

export function formatDuration(hours: number) {
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const rem = hours % 24
    return rem ? `${days}d ${rem}h` : `${days}d`
  }
  return `${hours}h`
}

export function parseDateOnly(yyyyMmDd: string) {
  return parseISO(`${yyyyMmDd}T12:00:00`)
}

export function formatDateOnly(yyyyMmDd: string, pattern = "MMM d, yyyy") {
  return format(parseDateOnly(yyyyMmDd), pattern)
}

export function toDateOnly(date: Date) {
  return format(date, "yyyy-MM-dd")
}

const TRIP_TYPE_LABELS: Record<string, string> = {
  inshore: "Inshore",
  offshore: "Offshore",
  deep_sea: "Deep Sea",
  fly_fishing: "Fly Fishing",
  trolling: "Trolling",
  bottom_fishing: "Bottom Fishing",
  spearfishing: "Spearfishing",
  sunset_cruise: "Sunset Cruise",
  custom: "Custom",
}

export function tripTypeLabel(type: string) {
  return TRIP_TYPE_LABELS[type] ?? type
}

const BOAT_TYPE_LABELS: Record<string, string> = {
  center_console: "Center Console",
  sportfisher: "Sportfisher",
  pontoon: "Pontoon",
  sailboat: "Sailboat",
  catamaran: "Catamaran",
  kayak: "Kayak",
  other: "Other",
}

export function boatTypeLabel(type: string) {
  return BOAT_TYPE_LABELS[type] ?? type
}
