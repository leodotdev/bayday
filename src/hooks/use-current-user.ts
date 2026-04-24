import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useCurrentUser() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const user = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip",
  )
  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (isAuthenticated && user === undefined),
  }
}
