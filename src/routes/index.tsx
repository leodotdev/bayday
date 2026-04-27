import { Link, createFileRoute } from "@tanstack/react-router"
import { convexQuery } from "@convex-dev/react-query"
import { ChevronRight } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { SearchBar } from "@/components/features/search/search-bar"
import { FeaturedChartersStrip } from "@/components/features/landing/featured-charters-strip"
import { NearbyBoats } from "@/components/features/landing/nearby-boats"

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.search.getFilterOptions, {}),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.search.getTrending, {}),
      ),
    ])
  },
  component: HomePage,
})

function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-sky-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Your next catch starts here
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Browse hundreds of fishing charters from trusted local captains.
              Reserve a date, message the captain, and head out.
            </p>
          </div>
          <div className="mt-10">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Featured trips
          </h2>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all trips
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <FeaturedChartersStrip />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <NearbyBoats />
      </section>
    </div>
  )
}
