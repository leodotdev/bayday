import { Link, Navigate, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  Anchor,
  CalendarClock,
  ChevronRight,
  DollarSign,
  Inbox,
  Ship,
} from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatPriceCents } from "@/lib/format"

export const Route = createFileRoute("/captain/")({
  component: CaptainHome,
})

function CaptainHome() {
  const { isAuthenticated, isHost, isLoading, user } = useCurrentUser()
  const stats = useQuery(
    api.bookings.getHostStats,
    isHost ? {} : "skip",
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" />
  if (!isHost) return <Navigate to="/captain/onboarding" />

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Manage your boats, listings, and incoming bookings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active listings"
          value={stats?.activeListings ?? 0}
          loading={stats === undefined}
          icon={<Anchor className="h-5 w-5" />}
        />
        <Stat
          label="Upcoming trips"
          value={stats?.upcomingBookings ?? 0}
          loading={stats === undefined}
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <Stat
          label="Pending requests"
          value={stats?.pendingRequests ?? 0}
          loading={stats === undefined}
          icon={<Inbox className="h-5 w-5" />}
        />
        <Stat
          label="This month"
          value={
            stats === undefined
              ? "—"
              : formatPriceCents(stats.thisMonthEarnings, { hideCents: true })
          }
          loading={stats === undefined}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ManageCard
          to="/captain/boats"
          title="Boats"
          subtitle="Manage your fleet, photos, and specs."
          icon={<Ship className="h-5 w-5" />}
        />
        <ManageCard
          to="/captain/listings"
          title="Listings"
          subtitle="Charters you offer guests, with shared-trip controls."
          icon={<Anchor className="h-5 w-5" />}
        />
        <ManageCard
          to="/captain/bookings"
          title="Bookings"
          subtitle="Confirm, cancel, or complete incoming trips."
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  loading,
  icon,
}: {
  label: string
  value: string | number
  loading: boolean
  icon: React.ReactNode
}) {
  return (
    <Card className="space-y-1 p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-semibold">{value}</div>
      )}
    </Card>
  )
}

function ManageCard({
  to,
  title,
  subtitle,
  icon,
}: {
  to: "/captain/boats" | "/captain/listings" | "/captain/bookings"
  title: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <Link to={to} className="group">
      <Card className="flex items-start gap-4 p-5 transition-colors hover:bg-muted/40">
        <div className="rounded-xl bg-muted p-2.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </Card>
    </Link>
  )
}
