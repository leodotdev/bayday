import { Navigate } from "@tanstack/react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"

export function HostGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHost, isLoading } = useCurrentUser()
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" />
  if (!isHost) return <Navigate to="/captain/onboarding" />
  return <>{children}</>
}
