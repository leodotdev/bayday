import { Link, Navigate } from "@tanstack/react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useCurrentUser()
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" />
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have access to this area.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to home
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
