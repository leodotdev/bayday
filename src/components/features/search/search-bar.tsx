import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
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
import {
  TripDatePicker,
  formatTripDateLabel,
  type DateMode,
  type TripDateValue,
} from "@/components/features/search/trip-date-picker"
import { cn } from "@/lib/utils"
import { parseDateOnly, toDateOnly } from "@/lib/format"

export type SearchValues = {
  city?: string
  date?: string
  dateEnd?: string
  partySize?: number
  flexible?: boolean
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
  const [cityOpen, setCityOpen] = useState(false)

  const initialDateMode: DateMode = initial?.flexible
    ? "flexible"
    : initial?.dateEnd && initial?.date && initial.date !== initial.dateEnd
      ? "range"
      : "single"

  const [dateValue, setDateValue] = useState<TripDateValue>(() => ({
    mode: initialDateMode,
    single:
      initialDateMode === "single" && initial?.date
        ? parseDateOnly(initial.date)
        : undefined,
    rangeFrom:
      initialDateMode === "range" && initial?.date
        ? parseDateOnly(initial.date)
        : undefined,
    rangeTo:
      initialDateMode === "range" && initial?.dateEnd
        ? parseDateOnly(initial.dateEnd)
        : undefined,
  }))

  const [partySize, setPartySize] = useState<number>(initial?.partySize ?? 2)
  const cities = filterOptions?.cities ?? []

  function submit() {
    let date: string | undefined
    let dateEnd: string | undefined
    let flexible = false
    if (dateValue.mode === "single" && dateValue.single) {
      date = toDateOnly(dateValue.single)
    } else if (dateValue.mode === "range" && dateValue.rangeFrom) {
      date = toDateOnly(dateValue.rangeFrom)
      if (dateValue.rangeTo) dateEnd = toDateOnly(dateValue.rangeTo)
    } else if (dateValue.mode === "flexible") {
      flexible = true
    }

    const values: SearchValues = {
      city: city || undefined,
      date,
      dateEnd,
      partySize,
      flexible: flexible || undefined,
    }
    if (onSubmit) onSubmit(values)
    else navigate({ to: "/search", search: values })
  }

  const dateLabel = formatTripDateLabel(dateValue) ?? "Add dates"
  const isPlaceholder =
    dateValue.mode !== "flexible" &&
    !dateValue.single &&
    !dateValue.rangeFrom

  function adjustParty(delta: number) {
    setPartySize((n) => Math.max(1, Math.min(20, n + delta)))
  }

  return (
    <div
      className={cn(
        "rounded-3xl border bg-background shadow-xs md:rounded-full",
        variant === "hero" && "shadow-md ring-1 ring-foreground/5",
      )}
    >
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* Where */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger
            className={cn(
              "group flex flex-1 items-center gap-3 px-5 text-left transition-colors hover:bg-muted/60 md:rounded-full",
              variant === "hero" ? "py-3" : "py-2.5",
            )}
          >
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="Where" placeholder={!city}>
              {city || "Anywhere"}
            </Field>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
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

        <RowDivider />

        {/* When */}
        <Popover>
          <PopoverTrigger
            className={cn(
              "flex flex-1 items-center gap-3 px-5 text-left transition-colors hover:bg-muted/60",
              variant === "hero" ? "py-3" : "py-2.5",
            )}
          >
            <CalendarIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Field label="When" placeholder={isPlaceholder}>
              {dateLabel}
            </Field>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <TripDatePicker value={dateValue} onChange={setDateValue} />
          </PopoverContent>
        </Popover>

        <RowDivider />

        {/* Who — inline stepper, no popover */}
        <div
          className={cn(
            "flex flex-1 items-center gap-3 px-5",
            variant === "hero" ? "py-3" : "py-2.5",
          )}
        >
          <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Field label="Who">
            {partySize} {partySize === 1 ? "angler" : "anglers"}
          </Field>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => adjustParty(-1)}
              disabled={partySize <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-40"
              aria-label="Fewer anglers"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => adjustParty(1)}
              disabled={partySize >= 20}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-40"
              aria-label="More anglers"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center border-t p-2 md:border-t-0 md:pr-2">
          <Button
            size={variant === "hero" ? "lg" : "default"}
            className="w-full rounded-2xl md:w-auto md:rounded-full"
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

function RowDivider() {
  return (
    <div
      className="h-px w-full self-stretch bg-border md:my-2 md:h-auto md:w-px"
      aria-hidden
    />
  )
}
