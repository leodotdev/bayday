import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { z } from "zod"
import { api } from "@/convex/_generated/api"
import { FilterChipBar } from "@/components/features/search/filter-chip-bar"
import { SortSelect } from "@/components/features/search/sort-select"
import { ListingsMap } from "@/components/features/map/listings-map"
import { ListingCard } from "@/components/features/listings/listing-card"
import { Skeleton } from "@/components/ui/skeleton"

const searchSchema = z.object({
  q: z.string().optional(),
  tripType: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  date: z.string().optional(),
  dateEnd: z.string().optional(),
  minPriceCents: z.number().optional(),
  maxPriceCents: z.number().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "rating", "reviews", "newest"])
    .optional(),
  partySize: z.number().optional(),
})

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
})

function SearchPage() {
  const params = Route.useSearch()

  const listings = useQuery(api.search.searchListings, {
    searchTerm: params.q,
    tripType: params.tripType,
    city: params.city,
    state: params.state,
    date: params.date,
    dateEnd: params.dateEnd,
    minPriceCents: params.minPriceCents,
    maxPriceCents: params.maxPriceCents,
    minGuests: params.partySize,
    sortBy: params.sortBy,
  })

  return (
    <div className="flex flex-col">
      <div className="sticky top-16 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <FilterChipBar params={params} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden md:inline">Sort by</span>
            <SortSelect />
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 p-4 lg:p-6">
          <div className="mb-4">
            <h1 className="text-xl font-semibold tracking-tight">
              {listings === undefined
                ? "Loading…"
                : `${listings.length} boats found`}
            </h1>
            {params.city ? (
              <p className="text-sm text-muted-foreground">
                Showing boats in {params.city}
                {params.state ? `, ${params.state}` : ""}
              </p>
            ) : null}
          </div>

          {listings === undefined ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No listings match your filters. Try clearing them.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l._id} listing={l} />
              ))}
            </div>
          )}
        </div>

        <div className="hidden h-[calc(100vh-8rem)] p-4 lg:sticky lg:top-32 lg:block lg:p-6">
          <ListingsMap listings={listings} className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
