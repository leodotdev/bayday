import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  Anchor,
  CalendarClock,
  DollarSign,
  MessageSquare,
  ShieldAlert,
  Ship,
  Star,
  UserRound,
} from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPriceCents } from "@/lib/format"

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
})

function AdminOverview() {
  const stats = useQuery(api.admin.stats, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live counts across the platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Users"
          value={stats?.users}
          sub={`${stats?.hosts ?? 0} captains · ${stats?.admins ?? 0} admins`}
          icon={<UserRound className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Banned"
          value={stats?.banned}
          icon={<ShieldAlert className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Listings"
          value={stats?.listings}
          sub={`${stats?.published ?? 0} published`}
          icon={<Anchor className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Boats"
          value={stats?.boats}
          icon={<Ship className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Bookings"
          value={stats?.bookings}
          sub={`${stats?.pending ?? 0} pending`}
          icon={<CalendarClock className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Reviews"
          value={stats?.reviews}
          icon={<Star className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Conversations"
          value={stats?.conversations}
          icon={<MessageSquare className="h-5 w-5" />}
          loading={stats === undefined}
        />
        <Stat
          label="Gross GMV"
          value={
            stats === undefined
              ? undefined
              : formatPriceCents(stats.grossRevenueCents, { hideCents: true })
          }
          icon={<DollarSign className="h-5 w-5" />}
          loading={stats === undefined}
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  icon,
  loading,
}: {
  label: string
  value: string | number | undefined
  sub?: string
  icon: React.ReactNode
  loading: boolean
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
        <>
          <div className="text-2xl font-semibold">{value ?? "—"}</div>
          {sub ? (
            <div className="text-xs text-muted-foreground">{sub}</div>
          ) : null}
        </>
      )}
    </Card>
  )
}
