import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronRight, Users } from "lucide-react"
import { HeroSearch } from "@/components/features/landing/hero-search"
import { FeaturedChartersStrip } from "@/components/features/landing/featured-charters-strip"
import { NearbyBoats } from "@/components/features/landing/nearby-boats"
import { SharedTripsStrip } from "@/components/features/landing/shared-trips-strip"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute("/")({
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
              Book in minutes, get out on the water.
            </p>
          </div>
          <div className="mt-10">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Shared trips
              </Badge>
              <span className="text-sm text-muted-foreground">
                Split the cost
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Open trips you can join
            </h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <SharedTripsStrip />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Featured charters
          </h2>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all charters
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
