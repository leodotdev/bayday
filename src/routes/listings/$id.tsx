import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  Users,
} from "lucide-react"
import { useMutation } from "convex/react"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "@tanstack/react-router"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { BookingCard } from "@/components/features/listings/booking-card"
import { BoatSpecsTable } from "@/components/features/listings/boat-specs-table"
import { CaptainCard } from "@/components/features/listings/captain-card"
import { FavoriteButton } from "@/components/features/listings/favorite-button"
import { ListingGallery } from "@/components/features/listings/listing-gallery"
import { ReviewsSection } from "@/components/features/listings/reviews-section"
import { TripMap } from "@/components/features/map/trip-map"
import { formatDuration, tripTypeLabel } from "@/lib/format"

export const Route = createFileRoute("/listings/$id")({
  component: ListingPage,
})

function ListingPage() {
  const { id } = Route.useParams()
  const data = useQuery(api.listings.getById, {
    id: id as Id<"listings">,
  })

  if (data === undefined) {
    return <ListingSkeleton />
  }
  if (data === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="mt-2 text-muted-foreground">
          This charter may have been unpublished or removed.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Browse other charters →
        </Link>
      </div>
    )
  }

  const listing = data
  const boat = data.boat
  const host = data.host

  const photos = (boat?.photos ?? []) as Id<"_storage">[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/search" className="hover:text-foreground">
          Back to search
        </Link>
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
              <Badge variant="secondary">
                {tripTypeLabel(listing.tripType)}
              </Badge>
              {listing.instantBook ? (
                <Badge>Instant book</Badge>
              ) : null}
              {listing.averageRating && listing.reviewCount > 0 ? (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  {listing.averageRating.toFixed(1)} ({listing.reviewCount})
                </Badge>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {listing.title}
              </h1>
              <FavoriteButton listingId={listing._id} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.departurePort}, {listing.departureCity},{" "}
                {listing.departureState}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(listing.durationHours)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                Up to {listing.maxGuests}
              </span>
            </div>
            <p className="max-w-prose pt-2 leading-relaxed">
              {listing.description}
            </p>
          </div>

          {listing.targetSpecies.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Target species</h3>
              <div className="flex flex-wrap gap-2">
                {listing.targetSpecies.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">What's included</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              <InclusionItem active={listing.captainIncluded} label="Captain included" />
              <InclusionItem active={listing.includesEquipment} label="Fishing equipment" />
              <InclusionItem active={listing.includesBait} label="Bait" />
              <InclusionItem active={listing.includesLunch} label="Lunch" />
              {listing.customInclusions.map((c) => (
                <InclusionItem key={c} active label={c} />
              ))}
            </ul>
          </div>

          {boat ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Boat specifications</h2>
              <BoatSpecsTable boat={boat} />
            </div>
          ) : null}

          {typeof listing.departureLatitude === "number" &&
          typeof listing.departureLongitude === "number" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Departure location</h2>
              <TripMap
                lat={listing.departureLatitude}
                lng={listing.departureLongitude}
                label={listing.departurePort}
                className="h-72"
              />
              <p className="text-sm text-muted-foreground">
                {listing.departurePort}, {listing.departureCity},{" "}
                {listing.departureState}
              </p>
            </div>
          ) : null}

          <CaptainCard listing={listing} />

          {host ? (
            <HostCard
              host={host}
              listingId={listing._id}
              hostId={listing.hostId}
            />
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
                {listing.cancellationPolicy || "Contact the captain for details."}
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingCard listing={listing} />
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

function HostCard({
  host,
  listingId,
  hostId,
}: {
  host: Doc<"users">
  listingId: Id<"listings">
  hostId: Id<"users">
}) {
  const displayName = host.name ?? host.email ?? "Host"
  const router = useRouter()
  const { isAuthenticated } = useCurrentUser()
  const getOrCreate = useMutation(api.conversations.getOrCreateInquiry)

  async function onMessage() {
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
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Hosted by</h3>
        <Button variant="outline" size="sm" onClick={onMessage} className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Message
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
          {host.avatarUrl ? (
            <img
              src={host.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{displayName}</div>
          {host.bio ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {host.bio}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function ListingSkeleton() {
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
