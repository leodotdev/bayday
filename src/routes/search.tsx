import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "convex/react"
import { z } from "zod"
import type { ViewMode } from "@/components/features/search/view-toggle"
import { api } from "@/convex/_generated/api"
import { FilterChipBar } from "@/components/features/search/filter-chip-bar"
import { SortSelect } from "@/components/features/search/sort-select"
import { SearchBar } from "@/components/features/search/search-bar"
import { ViewToggle } from "@/components/features/search/view-toggle"
import { ListingsMap } from "@/components/features/map/listings-map"
import { ListingCard } from "@/components/features/listings/listing-card"
import { SharedTripCard } from "@/components/features/shared-trips/shared-trip-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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
  flexible: z.boolean().optional(),
  view: z.enum(["list", "map", "split"]).optional(),
})

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const flexible = !!deps.flexible
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.search.getFilterOptions, {}),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.search.searchListings, {
          searchTerm: deps.q,
          tripType: deps.tripType,
          city: deps.city,
          state: deps.state,
          date: flexible ? undefined : deps.date,
          dateEnd: flexible ? undefined : deps.dateEnd,
          minPriceCents: deps.minPriceCents,
          maxPriceCents: deps.maxPriceCents,
          minGuests: deps.partySize,
          sortBy: deps.sortBy,
        }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.search.getOpenSharedTrips, {
          city: deps.city,
          state: deps.state,
          tripType: deps.tripType,
          date: flexible ? undefined : deps.date,
          dateEnd: flexible ? undefined : deps.dateEnd,
        }),
      ),
    ])
  },
  component: SearchPage,
})

function SearchPage() {
  const params = Route.useSearch()
  const navigate = useNavigate()
  const view: ViewMode = params.view ?? "split"

  // When flexible is on, drop the date filters so any future trip matches.
  const flexible = !!params.flexible
  const listings = useQuery(api.search.searchListings, {
    searchTerm: params.q,
    tripType: params.tripType,
    city: params.city,
    state: params.state,
    date: flexible ? undefined : params.date,
    dateEnd: flexible ? undefined : params.dateEnd,
    minPriceCents: params.minPriceCents,
    maxPriceCents: params.maxPriceCents,
    minGuests: params.partySize,
    sortBy: params.sortBy,
  })
  const sharedTrips = useQuery(api.search.getOpenSharedTrips, {
    city: params.city,
    state: params.state,
    tripType: params.tripType,
    date: flexible ? undefined : params.date,
    dateEnd: flexible ? undefined : params.dateEnd,
  })

  const totalCount =
    (listings?.length ?? 0) + (sharedTrips?.length ?? 0)

  function setView(next: ViewMode) {
    navigate({
      to: "/search",
      search: (prev) => ({ ...prev, view: next === "split" ? undefined : next }),
    })
  }

  const showList = view === "list" || view === "split"
  const showMap = view === "map" || view === "split"

  return (
    <div className="flex flex-col">
      {/* Primary: location, dates, guests */}
      <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-[100rem] space-y-3 px-4 py-4">
          <SearchBar
            variant="inline"
            initial={{
              city: params.city,
              date: params.date,
              dateEnd: params.dateEnd,
              partySize: params.partySize,
              flexible: params.flexible,
            }}
            onSubmit={(next) =>
              navigate({
                to: "/search",
                search: (prev) => ({
                  ...prev,
                  city: next.city,
                  date: next.date,
                  dateEnd: next.dateEnd,
                  partySize: next.partySize,
                  flexible: next.flexible,
                }),
              })
            }
          />

          {/* Secondary: filters / sort / view */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FilterChipBar params={params} />
            <div className="flex items-center gap-2">
              <SortSelect />
              <ViewToggle value={view} onChange={setView} />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid flex-1 grid-cols-1 gap-0",
          view === "split" &&
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]",
          view === "map" && "lg:grid-cols-1",
        )}
      >
        {showList ? (
          <div className="min-w-0 p-4 lg:p-6">
            <div className="mb-4">
              <h1 className="text-xl font-semibold tracking-tight">
                {listings === undefined
                  ? "Loading…"
                  : `${totalCount} ${totalCount === 1 ? "trip" : "trips"} found`}
              </h1>
              {params.city ? (
                <p className="text-sm text-muted-foreground">
                  Showing trips in {params.city}
                  {params.state ? `, ${params.state}` : ""}
                </p>
              ) : null}
            </div>

            {listings === undefined ? (
              <div
                className={cn(
                  "grid gap-4",
                  view === "split"
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[4/3] w-full rounded-xl"
                  />
                ))}
              </div>
            ) : listings.length === 0 && (sharedTrips?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No trips match your filters. Try clearing them.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-4",
                  view === "split"
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {(sharedTrips ?? []).map((trip) => (
                  <SharedTripCard key={trip.booking._id} trip={trip} />
                ))}
                {listings.map((l) => (
                  <ListingCard key={l._id} listing={l} />
                ))}
              </div>
            )}
            </section>
          </div>
        ) : null}

        {showMap ? (
          <div
            className={cn(
              "h-[calc(100vh-12rem)] p-4 lg:p-6",
              view === "split" && "hidden lg:sticky lg:top-44 lg:block",
              view === "map" && "h-[calc(100vh-10rem)]",
            )}
          >
            <ListingsMap
              listings={listings}
              sharedTrips={sharedTrips}
              className="h-full w-full"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
