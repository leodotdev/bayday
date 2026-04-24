import { Link, useRouter } from "@tanstack/react-router"
// Link kept for unauth menu
import { useAuthActions } from "@convex-dev/auth/react"
import { LogOut, UserRound } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

export function AuthMenu() {
  const { user, isAuthenticated, isLoading } = useCurrentUser()
  const { signOut } = useAuthActions()
  const router = useRouter()

  if (isLoading) {
    return <Skeleton className="h-8 w-20 rounded-full" />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/sign-in"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Sign in
        </Link>
        <Link
          to="/sign-up"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Sign up
        </Link>
      </div>
    )
  }

  const displayName =
    user.firstName ?? user.name ?? (user.email?.split("@")[0] ?? "Account")

  async function onSignOut() {
    await signOut()
    router.navigate({ to: "/" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
      >
        <div className="h-6 w-6 overflow-hidden rounded-full bg-muted">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="h-full w-full p-1 text-muted-foreground" />
          )}
        </div>
        <span className="hidden sm:inline">{displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.navigate({ to: "/profile" })}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.navigate({ to: "/trips" })}>
          My trips
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.navigate({ to: "/inbox" })}>
          Inbox
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

