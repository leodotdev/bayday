import { Link, useRouter } from "@tanstack/react-router"
import { useAuthActions } from "@convex-dev/auth/react"
import {
  Anchor,
  HelpCircle,
  Inbox,
  LogOut,
  Menu,
  Plane,
  Search,
  ShieldCheck,
  Ship,
  UserRound,
  Users,
} from "lucide-react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const { user, isAuthenticated, isHost, isAdmin } = useCurrentUser()
  const { signOut } = useAuthActions()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function go(to: string) {
    setOpen(false)
    router.navigate({ to })
  }

  async function onSignOut() {
    setOpen(false)
    await signOut()
    router.navigate({ to: "/" })
  }

  const displayName =
    user?.firstName ?? user?.name ?? (user?.email?.split("@")[0] ?? "Account")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Anchor className="h-5 w-5" />
            <span className="text-base font-semibold tracking-tight">
              DayTrip
            </span>
          </SheetTitle>
        </SheetHeader>

        {isAuthenticated && user ? (
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {displayName}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user.email ?? user.phone ?? "—"}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto py-2">
          <Item icon={<Search className="h-4 w-4" />} onSelect={() => go("/search")}>
            Find a Boat
          </Item>
          {isHost ? (
            <Item icon={<Ship className="h-4 w-4" />} onSelect={() => go("/captain")}>
              Captain dashboard
            </Item>
          ) : (
            <Item icon={<Ship className="h-4 w-4" />} onSelect={() => go("/captain/onboarding")}>
              List Your Boat
            </Item>
          )}
          <Item icon={<HelpCircle className="h-4 w-4" />} onSelect={() => go("/help")}>
            Help
          </Item>

          {isAuthenticated ? (
            <>
              <Divider />
              <Item icon={<UserRound className="h-4 w-4" />} onSelect={() => go("/profile")}>
                Profile
              </Item>
              <Item icon={<Plane className="h-4 w-4" />} onSelect={() => go("/trips")}>
                My trips
              </Item>
              <Item icon={<Inbox className="h-4 w-4" />} onSelect={() => go("/inbox")}>
                Inbox
              </Item>
              {isAdmin ? (
                <>
                  <Divider />
                  <Item
                    icon={<ShieldCheck className="h-4 w-4" />}
                    onSelect={() => go("/admin")}
                  >
                    Admin CMS
                  </Item>
                </>
              ) : null}
              <Divider />
              <Item icon={<LogOut className="h-4 w-4" />} onSelect={onSignOut}>
                Sign out
              </Item>
            </>
          ) : (
            <>
              <Divider />
              <Item
                icon={<UserRound className="h-4 w-4" />}
                onSelect={() => go("/sign-in")}
              >
                Sign in
              </Item>
              <Item
                icon={<Users className="h-4 w-4" />}
                onSelect={() => go("/sign-up")}
              >
                Sign up
              </Item>
            </>
          )}
        </div>

        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          <Link
            to="/help"
            onClick={() => setOpen(false)}
            className="hover:text-foreground"
          >
            Help & support
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Item({
  icon,
  children,
  onSelect,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-muted",
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </button>
  )
}

function Divider() {
  return <div className="my-2 border-t" />
}
