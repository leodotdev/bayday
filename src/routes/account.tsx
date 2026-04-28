import { Navigate, createFileRoute, useRouter } from "@tanstack/react-router"
import { useAuthActions } from "@convex-dev/auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useCurrentUser } from "@/hooks/use-current-user"
import { FavoritesGrid } from "@/components/features/profile/favorites-grid"
import { NotificationsForm } from "@/components/features/profile/notifications-form"
import { ProfileForm } from "@/components/features/profile/profile-form"
import { FeedbackForm } from "@/components/features/profile/feedback-form"

export const Route = createFileRoute("/account")({
  component: AccountPage,
})

function AccountPage() {
  const { user, isAuthenticated, isLoading } = useCurrentUser()
  const { signOut } = useAuthActions()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" />
  }

  async function onSignOut() {
    await signOut()
    router.navigate({ to: "/" })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Account
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>
        <Button variant="outline" onClick={onSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Details</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsForm user={user} />
        </TabsContent>
        <TabsContent value="favorites">
          <FavoritesGrid />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackForm user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
