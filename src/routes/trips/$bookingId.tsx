import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { BoatSpecsTable } from "@/components/features/listings/boat-specs-table"
import { CaptainCard } from "@/components/features/listings/captain-card"
import { ListingGallery } from "@/components/features/listings/listing-gallery"
import { ReviewsSection } from "@/components/features/listings/reviews-section"
import { SpeciesGrid } from "@/components/features/listings/species-card"
import { TripMap } from "@/components/features/map/trip-map"
import { TripSummaryCard } from "@/components/features/listings/trip-summary-card"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  cancellationPolicyLabel,
  formatDateOnly,
  formatDuration,
  tripTypeLabel,
} from "@/lib/format"

const searchSchema = z.object({})

export const Route = createFileRoute("/trips/$bookingId")({
  validateSearch: searchSchema,
  component: TripDetailPage,
})

function TripDetailPage() {
  const { bookingId } = Route.useParams()
  const { user, isAuthenticated } = useCurrentUser()

  const data = useQuery(api.bookings.getById, {
    id: bookingId as Id<"bookings">,
  })

  if (data === undefined) return <TripSkeleton />
  if (data === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Trip not found</h1>
        <p className="mt-2 text-muted-foreground">
          This trip may have been cancelled or is no longer available.
        </p>
        <Link
          to="/trips"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to your trips →
        </Link>
      </div>
    )
  }

  const booking = data
  const listing = data.listing
  const boat = data.boat

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Listing unavailable</h1>
      </div>
    )
  }

  const isPrimary = isAuthenticated && user?._id === booking.guestId
  const photos = (boat?.photos ?? []) as Array<Id<"_storage">>

  const totalSpots = booking.costSharingMaxSpots ?? booking.partySize

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        {isPrimary ? (
          <Link to="/trips" className="hover:text-foreground">
            Your trips
          </Link>
        ) : (
          <Link to="/search" className="hover:text-foreground">
            Browse trips
          </Link>
        )}
        <ChevronRight className="h-3 w-3" />
        <span>{tripTypeLabel(listing.tripType)} charters</span>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="min-w-0 space-y-8">
          <ListingGallery title={listing.title} photos={photos} />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{tripTypeLabel(listing.tripType)}</Badge>
              {listing.averageRating && listing.reviewCount > 0 ? (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  {listing.averageRating.toFixed(1)} ({listing.reviewCount})
                </Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.departurePort}, {listing.departureCity},{" "}
                {listing.departureState}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDateOnly(booking.date, "EEE, MMM d")} ·{" "}
                {booking.startTime}–{booking.endTime} (
                {formatDuration(listing.durationHours)})
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {totalSpots} {totalSpots === 1 ? "angler" : "anglers"}
              </span>
            </div>
            {listing.description ? (
              <p className="max-w-prose pt-2 leading-relaxed">
                {listing.description}
              </p>
            ) : null}
          </div>

          {listing.targetSpecies.length > 0 ? (
            <Section title="Target species" bleed>
              <SpeciesGrid species={listing.targetSpecies} />
            </Section>
          ) : null}

          <Section title="What's included">
            <ul className="grid gap-2 sm:grid-cols-2">
              <InclusionItem
                active={listing.captainIncluded}
                label="Captain included"
              />
              <InclusionItem
                active={listing.includesEquipment}
                label="Fishing equipment"
              />
              <InclusionItem active={listing.includesBait} label="Bait" />
              <InclusionItem active={listing.includesLunch} label="Lunch" />
              {listing.customInclusions.map((c) => (
                <InclusionItem key={c} active label={c} />
              ))}
            </ul>
          </Section>

          {boat ? (
            <Section title="Boat specifications" bleed>
              <BoatSpecsTable boat={boat} />
            </Section>
          ) : null}

          {typeof listing.departureLatitude === "number" &&
          typeof listing.departureLongitude === "number" ? (
            <Section title="Departure location" bleed>
              <TripMap
                lat={listing.departureLatitude}
                lng={listing.departureLongitude}
                label={listing.departurePort}
                className="h-72"
              />
              <p className="p-6 text-sm text-muted-foreground">
                {listing.departurePort}, {listing.departureCity},{" "}
                {listing.departureState}
              </p>
            </Section>
          ) : null}

          {listing.captainIncluded || listing.captainName ? (
            <Section
              title="About your captain"
              action={
                <MessageCaptainButton
                  listingId={listing._id}
                  hostId={listing.hostId}
                />
              }
            >
              <CaptainCard listing={listing} />
            </Section>
          ) : null}

          <Tabs defaultValue="reviews" className="space-y-4">
            <TabsList>
              <TabsTrigger value="reviews">
                Reviews ({listing.reviewCount})
              </TabsTrigger>
              <TabsTrigger value="policy">Cancellation policy</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews">
              <ReviewsSection listingId={listing._id} />
            </TabsContent>
            <TabsContent value="policy">
              <p className="text-sm text-muted-foreground">
                {cancellationPolicyLabel(listing.cancellationPolicy)}
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <TripSummaryCard bookingId={booking._id} booking={booking} />
        </aside>
      </div>
    </div>
  )
}

function InclusionItem({ active, label }: { active: boolean; label: string }) {
  return (
    <li
      className={
        active
          ? "flex items-center gap-2 text-sm"
          : "flex items-center gap-2 text-sm text-muted-foreground line-through"
      }
    >
      <CheckCircle2
        className={
          active
            ? "h-4 w-4 text-emerald-600 dark:text-emerald-400"
            : "h-4 w-4 text-muted-foreground"
        }
      />
      {label}
    </li>
  )
}

function MessageCaptainButton({
  listingId,
  hostId,
}: {
  listingId: Id<"listings">
  hostId: Id<"users">
}) {
  const router = useRouter()
  const { isAuthenticated } = useCurrentUser()
  const getOrCreate = useMutation(api.conversations.getOrCreateInquiry)

  async function onClick() {
    if (!isAuthenticated) {
      router.navigate({ to: "/sign-in" })
      return
    }
    try {
      const conversationId = await getOrCreate({ listingId, hostId })
      router.navigate({
        to: "/conversation/$id",
        params: { id: conversationId },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start chat")
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={onClick}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      Message captain
    </Button>
  )
}

function Section({
  title,
  action,
  bleed,
  children,
}: {
  title: string
  action?: React.ReactNode
  bleed?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action}
      </div>
      <Card className={bleed ? "gap-0 overflow-hidden p-0" : "p-6"}>{children}</Card>
    </section>
  )
}

function TripSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-8 lg:py-10">
      <Skeleton className="h-96 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
