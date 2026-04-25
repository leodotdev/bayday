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
import { cn } from "@/lib/utils"
import { parseDateOnly, toDateOnly } from "@/lib/format"

export type SearchValues = {
  city?: string
  date?: string
  dateEnd?: string
  partySize?: number
}

type Props = {
  /** "hero" gets a tall, prominent treatment; "inline" is for the search page header */
  variant?: "hero" | "inline"
  initial?: SearchValues
  /** When provided, called on submit instead of navigating (for /search itself) */
  onSubmit?: (next: SearchValues) => void
}

export function SearchBar({ variant = "hero", initial, onSubmit }: Props) {
  const navigate = useNavigate()
  const filterOptions = useQuery(api.search.getFilterOptions, {})

  const [city, setCity] = useState<string | undefined>(initial?.city)
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => ({
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
    if (onSubmit) {
      onSubmit(values)
    } else {
      navigate({ to: "/search", search: values })
    }
  }

  const dateLabel = !range.from
    ? "Add dates"
    : !range.to
      ? format(range.from, "MMM d")
      : range.from.toDateString() === range.to.toDateString()
        ? format(range.from, "EEE, MMM d")
        : `${format(range.from, "MMM d")} – ${format(range.to, "MMM d")}`

  const padding = variant === "hero" ? "px-5 py-3.5" : "px-4 py-2.5"

  return (
    <div
      className={cn(
        "rounded-full border bg-background shadow-sm",
        variant === "hero" && "shadow-lg ring-1 ring-foreground/5",
      )}
    >
      <div className="grid items-stretch gap-1 md:grid-cols-[1.4fr_auto_1.2fr_auto_0.8fr_auto] md:divide-x">
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger
            className={cn(
              "flex items-center gap-3 rounded-full text-left transition-colors hover:bg-muted",
              padding,
            )}
          >
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <Label>Where</Label>
              <Value placeholder={!city}>{city || "Anywhere"}</Value>
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command>
              <CommandInput placeholder="Search cities…" />
              <CommandList>
                <CommandEmpty>No cities found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__any__"
                    onSelect={() => {
                      setCity(undefined)
                      setCityOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !city ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Anywhere
                  </CommandItem>
                  {cities.map((c) => (
                    <CommandItem
                      key={c}
                      value={c}
                      onSelect={() => {
                        setCity(c)
                        setCityOpen(false)
                      }}
                    >
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
          </PopoverContent>
        </Popover>

        <Divider />

        <Popover>
          <PopoverTrigger
            className={cn(
              "flex items-center gap-3 rounded-full text-left transition-colors hover:bg-muted",
              padding,
            )}
          >
            <CalendarIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <Label>When</Label>
              <Value placeholder={!range.from}>{dateLabel}</Value>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(next) =>
                setRange({
                  from: next?.from,
                  to: next?.to,
                })
              }
              disabled={{ before: new Date() }}
              numberOfMonths={2}
            />
            <div className="flex items-center justify-between border-t p-3">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setRange({ from: undefined, to: undefined })}
              >
                Clear
              </button>
              <div className="text-xs text-muted-foreground">
                {range.from && range.to
                  ? `${Math.max(
                      1,
                      Math.round(
                        (range.to.getTime() - range.from.getTime()) /
                          86400000,
                      ) + 1,
                    )} days`
                  : range.from
                    ? "Single day"
                    : "Pick start and end"}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Divider />

        <Popover>
          <PopoverTrigger
            className={cn(
              "flex items-center gap-3 rounded-full text-left transition-colors hover:bg-muted",
              padding,
            )}
          >
            <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <Label>Who</Label>
              <Value placeholder={!partySize}>
                {partySize} {partySize === 1 ? "angler" : "anglers"}
              </Value>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
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
                  onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted disabled:opacity-50"
                  disabled={partySize <= 1}
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="w-6 text-center text-sm font-medium">
                  {partySize}
                </div>
                <button
                  type="button"
                  onClick={() => setPartySize((n) => Math.min(20, n + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center pr-1.5">
          <Button
            size={variant === "hero" ? "lg" : "default"}
            className="rounded-full"
            onClick={submit}
          >
            <Search className="h-4 w-4" />
            <span className={variant === "hero" ? "" : "hidden md:inline"}>
              Search
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  )
}

function Value({
  placeholder,
  children,
}: {
  placeholder?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "truncate text-base font-medium",
        placeholder && "text-muted-foreground",
      )}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <div className="hidden h-8 self-center md:block" aria-hidden />
}
