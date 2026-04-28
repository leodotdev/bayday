import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Filter, X } from "lucide-react"
import type { Route as SearchRoute } from "@/routes/search"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatPriceCents, tripTypeLabel } from "@/lib/format"

type SearchParams = ReturnType<typeof SearchRoute.useSearch>

const chipClass = (active: boolean) =>
  cn(buttonVariants({ variant: "outline", size: "sm" }), active && "bg-muted")

export function FilterChipBar({ params }: { params: SearchParams }) {
  const navigate = useNavigate()
  const options = useQuery(api.search.getFilterOptions, {})

  function patch(next: Partial<SearchParams>) {
    navigate({
      to: "/search",
      search: (prev) => {
        const merged = { ...prev, ...next } as Record<string, unknown>
        Object.keys(merged).forEach((k) => {
          if (merged[k] === undefined || merged[k] === "") delete merged[k]
        })
        return merged
      },
    })
  }

  const priceActive =
    params.minPriceCents !== undefined || params.maxPriceCents !== undefined
  const activeCount = (params.tripType ? 1 : 0) + (priceActive ? 1 : 0)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Filter className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <Badge variant="secondary" className="ml-1">
            {activeCount}
          </Badge>
        ) : null}
      </Button>

      <Popover>
        <PopoverTrigger className={chipClass(priceActive)}>
          Price
          {priceActive && (
            <Badge variant="secondary" className="ml-1">
              {params.minPriceCents
                ? formatPriceCents(params.minPriceCents, { hideCents: true })
                : "$0"}
              {" – "}
              {params.maxPriceCents
                ? formatPriceCents(params.maxPriceCents, { hideCents: true })
                : "∞"}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Price per trip</div>
              <p className="text-xs text-muted-foreground">
                All prices in USD.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="min-price">Min</Label>
                <Input
                  id="min-price"
                  type="number"
                  inputMode="numeric"
                  placeholder="$0"
                  defaultValue={
                    params.minPriceCents !== undefined
                      ? params.minPriceCents / 100
                      : ""
                  }
                  onBlur={(e) => {
                    const v = e.currentTarget.value
                      ? Number.parseInt(e.currentTarget.value, 10) * 100
                      : undefined
                    patch({ minPriceCents: v })
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-price">Max</Label>
                <Input
                  id="max-price"
                  type="number"
                  inputMode="numeric"
                  placeholder="$∞"
                  defaultValue={
                    params.maxPriceCents !== undefined
                      ? params.maxPriceCents / 100
                      : ""
                  }
                  onBlur={(e) => {
                    const v = e.currentTarget.value
                      ? Number.parseInt(e.currentTarget.value, 10) * 100
                      : undefined
                    patch({ maxPriceCents: v })
                  }}
                />
              </div>
            </div>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() =>
                patch({ minPriceCents: undefined, maxPriceCents: undefined })
              }
            >
              Reset
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger className={chipClass(Boolean(params.tripType))}>
          Type
          {params.tripType && (
            <Badge variant="secondary" className="ml-1">
              {tripTypeLabel(params.tripType)}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="max-h-72 overflow-y-auto p-2">
            {(options?.tripTypes ?? []).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => patch({ tripType: t })}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                {tripTypeLabel(t)}
                {params.tripType === t ? (
                  <Badge variant="secondary">Selected</Badge>
                ) : null}
              </button>
            ))}
          </div>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => patch({ tripType: undefined })}
            >
              Any type
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            patch({
              tripType: undefined,
              minPriceCents: undefined,
              maxPriceCents: undefined,
            })
          }
        >
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
