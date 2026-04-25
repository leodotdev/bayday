import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  Check,
  MapPin,
  Minus,
  Plus,
  Search,
  Users,
} from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { parseDateOnly, toDateOnly } from "@/lib/format"

export type SearchValues = {
  city?: string
  date?: string
  dateEnd?: string
  partySize?: number
}

type Props = {
  variant?: "hero" | "inline"
  initial?: SearchValues
  onSubmit?: (next: SearchValues) => void
}

export function SearchBar({ variant = "hero", initial, onSubmit }: Props) {
  const navigate = useNavigate()
  const filterOptions = useQuery(api.search.getFilterOptions, {})

  const [city, setCity] = useState<string | undefined>(initial?.city)
  const [range, setRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>(() => ({
    from: initial?.date ? parseDateOnly(initial.date) : undefined,
    to: initial?.dateEnd ? parseDateOnly(initial.dateEnd) : undefined,
  }))
  const [partySize, setPartySize] = useState<number>(initial?.partySize ?? 2)
  const [cityOpen, setCityOpen] = useState(false)

  const cities = filterOptions?.cities ?? []

  function submit() {
    const values: SearchValues = {
      city: city || undefined,
      date: range.from ? toDateOnly(range.from) : undefined,
      dateEnd: range.to ? toDateOnly(range.to) : undefined,
      partySize,
    }
    if (onSubmit) onSubmit(values)
    else navigate({ to: "/search", search: values })
  }

  const dateLabel = !range.from
    ? "Add dates"
    : !range.to
      ? format(range.from, "MMM d")
      : range.from.toDateString() === range.to.toDateString()
        ? format(range.from, "EEE, MMM d")
        : `${format(range.from, "MMM d")} – ${format(range.to, "MMM d")}`

  return (
    <div
      className={cn(
        "rounded-3xl border bg-background shadow-sm md:rounded-full",
        variant === "hero" && "shadow-lg ring-1 ring-foreground/5",
      )}
    >
      {/* Mobile: stacked rows */}
      <div className="flex flex-col md:hidden">
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger className="flex w-full items-center gap-3 rounded-t-3xl px-4 py-3 text-left transition-colors hover:bg-muted">
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="Where" placeholder={!city}>
              {city || "Anywhere"}
            </Field>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <CityCommand
              cities={cities}
              city={city}
              onPick={(c) => {
                setCity(c)
                setCityOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        <Separator />

        <Popover>
          <PopoverTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted">
            <CalendarIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="When" placeholder={!range.from}>
              {dateLabel}
            </Field>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <DateRange range={range} onChange={setRange} />
          </PopoverContent>
        </Popover>

        <Separator />

        <Popover>
          <PopoverTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted">
            <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="Who">
              {partySize} {partySize === 1 ? "angler" : "anglers"}
            </Field>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <PartyStepper value={partySize} onChange={setPartySize} />
          </PopoverContent>
        </Popover>

        <div className="border-t p-2">
          <Button
            size="lg"
            className="w-full rounded-2xl"
            onClick={submit}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Desktop: single row pill */}
      <div className="hidden items-stretch md:flex">
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger
            className={cn(
              "group flex flex-1 items-center gap-3 rounded-full px-5 text-left transition-colors hover:bg-muted/60",
              variant === "hero" ? "py-3" : "py-2.5",
            )}
          >
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="Where" placeholder={!city}>
              {city || "Anywhere"}
            </Field>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <CityCommand
              cities={cities}
              city={city}
              onPick={(c) => {
                setCity(c)
                setCityOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        <DesktopDivider />

        <Popover>
          <PopoverTrigger
            className={cn(
              "flex flex-1 items-center gap-3 px-5 text-left transition-colors hover:bg-muted/60",
              variant === "hero" ? "py-3" : "py-2.5",
            )}
          >
            <CalendarIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="When" placeholder={!range.from}>
              {dateLabel}
            </Field>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <DateRange range={range} onChange={setRange} />
          </PopoverContent>
        </Popover>

        <DesktopDivider />

        <Popover>
          <PopoverTrigger
            className={cn(
              "flex flex-1 items-center gap-3 px-5 text-left transition-colors hover:bg-muted/60",
              variant === "hero" ? "py-3" : "py-2.5",
            )}
          >
            <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="Who">
              {partySize} {partySize === 1 ? "angler" : "anglers"}
            </Field>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <PartyStepper value={partySize} onChange={setPartySize} />
          </PopoverContent>
        </Popover>

        <div className="flex items-center pr-2">
          <Button
            size={variant === "hero" ? "lg" : "default"}
            className="rounded-full"
            onClick={submit}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  placeholder,
  children,
}: {
  label: string
  placeholder?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "truncate text-base font-medium",
          placeholder && "text-muted-foreground/70",
        )}
      >
        {children}
      </div>
    </div>
  )
}

function DesktopDivider() {
  return <div className="my-2 w-px self-stretch bg-border" aria-hidden />
}

function CityCommand({
  cities,
  city,
  onPick,
}: {
  cities: string[]
  city: string | undefined
  onPick: (next: string | undefined) => void
}) {
  return (
    <Command>
      <CommandInput placeholder="Search cities…" />
      <CommandList>
        <CommandEmpty>No cities found.</CommandEmpty>
        <CommandGroup>
          <CommandItem value="__any__" onSelect={() => onPick(undefined)}>
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                !city ? "opacity-100" : "opacity-0",
              )}
            />
            Anywhere
          </CommandItem>
          {cities.map((c) => (
            <CommandItem key={c} value={c} onSelect={() => onPick(c)}>
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  city === c ? "opacity-100" : "opacity-0",
                )}
              />
              {c}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function DateRange({
  range,
  onChange,
}: {
  range: { from: Date | undefined; to: Date | undefined }
  onChange: (next: { from: Date | undefined; to: Date | undefined }) => void
}) {
  return (
    <>
      <Calendar
        mode="range"
        selected={range}
        onSelect={(next) =>
          onChange({ from: next?.from, to: next?.to })
        }
        disabled={{ before: new Date() }}
        numberOfMonths={2}
      />
      <div className="flex items-center justify-between border-t p-3">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => onChange({ from: undefined, to: undefined })}
        >
          Clear
        </button>
        <div className="text-xs text-muted-foreground">
          {range.from && range.to
            ? `${Math.max(
                1,
                Math.round(
                  (range.to.getTime() - range.from.getTime()) / 86400000,
                ) + 1,
              )} days`
            : range.from
              ? "Single day"
              : "Pick start and end"}
        </div>
      </div>
    </>
  )
}

function PartyStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-base font-semibold">Anglers</div>
        <div className="text-xs text-muted-foreground">
          Adults and kids combined.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted disabled:opacity-50"
          disabled={value <= 1}
          aria-label="Decrease"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="w-6 text-center text-sm font-medium">{value}</div>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"
          aria-label="Increase"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
