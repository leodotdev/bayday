import { format } from "date-fns"
import type { Matcher } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type DateMode = "single" | "range" | "flexible"

export type TripDateValue = {
  mode: DateMode
  single?: Date
  rangeFrom?: Date
  rangeTo?: Date
}

type Props = {
  value: TripDateValue
  onChange: (next: TripDateValue) => void
  /** Modes the picker should expose. Defaults to all three. If only one
   *  mode is allowed, the tab bar is hidden. */
  modes?: ReadonlyArray<DateMode>
  /** Days disabled in the calendar. Defaults to "before today". */
  disabled?: Matcher | Matcher[]
  className?: string
}

const DEFAULT_MODES: ReadonlyArray<DateMode> = ["single", "range", "flexible"]

export function TripDatePicker({
  value,
  onChange,
  modes = DEFAULT_MODES,
  disabled,
  className,
}: Props) {
  const disable = disabled ?? { before: new Date() }
  const showTabs = modes.length > 1

  function setMode(mode: DateMode) {
    onChange({ ...value, mode })
  }

  function clear() {
    onChange({
      mode: value.mode,
      single: undefined,
      rangeFrom: undefined,
      rangeTo: undefined,
    })
  }

  const summary = summarize(value)

  return (
    <div className={cn("w-auto", className)}>
      <Tabs
        value={value.mode}
        onValueChange={(v) => v && setMode(v as DateMode)}
        className="w-full"
      >
        {showTabs ? (
          <div className="border-b p-3">
            <TabsList className="w-full">
              {modes.includes("single") ? (
                <TabsTrigger value="single" className="flex-1">
                  Single day
                </TabsTrigger>
              ) : null}
              {modes.includes("range") ? (
                <TabsTrigger value="range" className="flex-1">
                  Date range
                </TabsTrigger>
              ) : null}
              {modes.includes("flexible") ? (
                <TabsTrigger value="flexible" className="flex-1">
                  Flexible
                </TabsTrigger>
              ) : null}
            </TabsList>
          </div>
        ) : null}

        {value.mode === "single" ? (
          <Calendar
            mode="single"
            selected={value.single}
            onSelect={(d) => onChange({ ...value, single: d })}
            disabled={disable}
            numberOfMonths={1}
          />
        ) : null}

        {value.mode === "range" ? (
          <Calendar
            mode="range"
            selected={{ from: value.rangeFrom, to: value.rangeTo }}
            onSelect={(next) =>
              onChange({
                ...value,
                rangeFrom: next?.from,
                rangeTo: next?.to,
              })
            }
            disabled={disable}
            numberOfMonths={2}
          />
        ) : null}

        {value.mode === "flexible" ? (
          <div className="space-y-3 p-4 text-sm">
            <p className="text-muted-foreground">
              Match trips on any future date — show me what's available.
            </p>
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border p-3">
              <Checkbox checked readOnly className="mt-0.5" />
              <div>
                <Label className="text-sm font-medium">I'm flexible</Label>
                <p className="text-xs text-muted-foreground">
                  Sort by best match instead of by date.
                </p>
              </div>
            </label>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t p-3">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={clear}
          >
            Clear
          </button>
          <div className="text-xs text-muted-foreground">{summary}</div>
        </div>
      </Tabs>
    </div>
  )
}

function summarize(value: TripDateValue): string {
  if (
    value.mode === "range" &&
    value.rangeFrom &&
    value.rangeTo
  ) {
    const days = Math.max(
      1,
      Math.round(
        (value.rangeTo.getTime() - value.rangeFrom.getTime()) / 86400000,
      ) + 1,
    )
    return `${days} ${days === 1 ? "day" : "days"}`
  }
  if (value.mode === "single" && value.single) return "1 day"
  if (value.mode === "flexible") return "Any date"
  return "Pick a date"
}

/** Friendly trigger label for the current value. */
export function formatTripDateLabel(value: TripDateValue): string | null {
  if (value.mode === "single" && value.single) {
    return format(value.single, "EEE, MMM d")
  }
  if (value.mode === "range" && value.rangeFrom) {
    return value.rangeTo
      ? `${format(value.rangeFrom, "MMM d")} – ${format(value.rangeTo, "MMM d")}`
      : format(value.rangeFrom, "MMM d")
  }
  if (value.mode === "flexible") return "Flexible — any time"
  return null
}
