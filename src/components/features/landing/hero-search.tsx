import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Check, MapPin, Search, Users } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toDateOnly } from "@/lib/format"

export function HeroSearch() {
  const navigate = useNavigate()
  const filterOptions = useQuery(api.search.getFilterOptions, {})

  const [city, setCity] = useState<string | undefined>(undefined)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [partySize, setPartySize] = useState<string>("2")
  const [cityOpen, setCityOpen] = useState(false)

  const cities = filterOptions?.cities ?? []

  function onSearch() {
    navigate({
      to: "/search",
      search: {
        city: city || undefined,
        date: date ? toDateOnly(date) : undefined,
        partySize: Number.parseInt(partySize, 10),
      },
    })
  }

  return (
    <div className="rounded-4xl border bg-background/90 p-2 shadow-lg backdrop-blur">
      <div className="grid items-stretch gap-2 md:grid-cols-[1.4fr_1fr_0.8fr_auto]">
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger
            className={cn(
              "group/field flex items-center gap-3 rounded-3xl px-4 py-3 text-left transition-colors hover:bg-muted",
            )}
          >
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Destination
              </div>
              <div className="truncate text-base font-medium">
                {city || "Where to?"}
              </div>
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

        <Popover>
          <PopoverTrigger
            className={cn(
              "flex items-center gap-3 rounded-3xl px-4 py-3 text-left transition-colors hover:bg-muted",
            )}
          >
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </div>
              <div className="truncate text-base font-medium">
                {date ? format(date, "EEE, MMM d") : "Add date"}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3 rounded-3xl px-4 py-2 transition-colors hover:bg-muted">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Anglers
            </div>
            <Select
              value={partySize}
              onValueChange={(v) => setPartySize(v ?? "1")}
            >
              <SelectTrigger className="h-auto border-0 p-0 shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "angler" : "anglers"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button size="lg" className="h-full rounded-3xl px-6" onClick={onSearch}>
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  )
}
