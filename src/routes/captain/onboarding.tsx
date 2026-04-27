import { useState } from "react"
import { Navigate, createFileRoute, useRouter } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { Anchor, CheckCircle2, Loader2, Ship, Users } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"

export const Route = createFileRoute("/captain/onboarding")({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { isAuthenticated, isLoading, isHost } = useCurrentUser()
  const upgrade = useMutation(api.users.upgradeToHost)
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Skeleton className="h-10 w-64" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/sign-up" search={{ redirect: "/captain/onboarding" }} />
    )
  }

  if (isHost) {
    return <Navigate to="/captain" />
  }

  async function onUpgrade() {
    setSubmitting(true)
    try {
      await upgrade({})
      toast.success("Welcome aboard, captain!")
      router.navigate({ to: "/captain" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upgrade")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="space-y-3 text-center">
        <Anchor className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          List your boat on DayTrip
        </h1>
        <p className="text-muted-foreground">
          Run charters, manage bookings, and choose whether to open trips
          for split-cost groups — all from one dashboard.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Bullet
          icon={<Ship className="h-6 w-6 text-primary" />}
          title="Add your boats"
          body="One captain, many boats. Add specs, amenities, and photos once."
        />
        <Bullet
          icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
          title="Publish trips"
          body="Define duration, pricing, and target species per offering."
        />
        <Bullet
          icon={<Users className="h-6 w-6 text-primary" />}
          title="Message anglers"
          body="Coordinate gear, dock instructions, and trip details in-app."
        />
      </div>

      <div className="mt-10 flex justify-center">
        <Button size="lg" onClick={onUpgrade} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Become a captain
        </Button>
      </div>
    </div>
  )
}

function Bullet({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <Card className="space-y-2 p-5">
      {icon}
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </Card>
  )
}
