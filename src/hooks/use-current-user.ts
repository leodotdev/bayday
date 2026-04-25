import { useEffect, useRef } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useCurrentUser() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const user = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip",
  )
  const createOrGet = useMutation(api.users.createOrGet)
  const initialized = useRef(false)

  // First auth → ensure the user record has role/createdAt populated.
  // Triggers the welcome email server-side.
  useEffect(() => {
    if (!isAuthenticated) {
      initialized.current = false
      return
    }
    if (initialized.current) return
    if (user === undefined) return
    if (user && user.createdAt) return
    initialized.current = true
    createOrGet({}).catch(() => {})
  }, [isAuthenticated, user, createOrGet])

  const role = user?.role
  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (isAuthenticated && user === undefined),
    isHost: role === "host" || role === "admin",
    isAdmin: role === "admin",
  }
}
