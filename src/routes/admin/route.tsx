import {
  createFileRoute,
  Link,
  Outlet,
} from "@tanstack/react-router"
import {
  Anchor,
  CalendarClock,
  LayoutDashboard,
  MessageSquare,
  Ship,
  Star,
  UserRound,
} from "lucide-react"
import { AdminGuard } from "@/components/features/admin/admin-guard"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>
  ),
})

const NAV: ReadonlyArray<{
  to:
    | "/admin"
    | "/admin/users"
    | "/admin/listings"
    | "/admin/boats"
    | "/admin/bookings"
    | "/admin/reviews"
    | "/admin/conversations"
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: UserRound },
  { to: "/admin/listings", label: "Listings", icon: Anchor },
  { to: "/admin/boats", label: "Boats", icon: Ship },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/conversations", label: "Conversations", icon: MessageSquare },
]

function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-[100rem] gap-6 px-4 py-8 lg:px-8">
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 self-start lg:block">
        <div className="space-y-1">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admin CMS
          </div>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted",
              )}
              activeProps={{
                className: "bg-muted font-medium",
              }}
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
