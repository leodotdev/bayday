import { Link } from "@tanstack/react-router"
import { Anchor } from "lucide-react"
import { AuthMenu } from "@/components/layout/auth-menu"
import { MobileNav } from "@/components/layout/mobile-nav"
import { useCurrentUser } from "@/hooks/use-current-user"

export function SiteHeader() {
  const { isHost } = useCurrentUser()
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Anchor className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">DayTrip</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/search"
            className="text-base font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Find a Boat
          </Link>
          {isHost ? (
            <Link
              to="/captain"
              className="text-base font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Captain dashboard
            </Link>
          ) : (
            <Link
              to="/captain/onboarding"
              className="text-base font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              List Your Boat
            </Link>
          )}
          <Link
            to="/help"
            className="text-base font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Help
          </Link>
        </nav>

        <div className="hidden md:block">
          <AuthMenu />
        </div>
        <MobileNav />
      </div>
    </header>
  )
}
