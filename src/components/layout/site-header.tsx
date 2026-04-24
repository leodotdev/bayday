import { Link } from "@tanstack/react-router"
import { Anchor } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AuthMenu } from "@/components/layout/auth-menu"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Anchor className="h-6 w-6" />
          <span className="text-lg">
            <span className="font-bold">Bay</span>
            <span className="font-light">Day</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/search"
            className="text-base font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Find a Boat
          </Link>
          <Tooltip>
            <TooltipTrigger
              className="cursor-not-allowed text-base font-medium text-muted-foreground/60"
              disabled
            >
              List Your Boat
            </TooltipTrigger>
            <TooltipContent>Captain portal coming soon</TooltipContent>
          </Tooltip>
          <Link
            to="/help"
            className="text-base font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Help
          </Link>
        </nav>

        <AuthMenu />
      </div>
    </header>
  )
}
