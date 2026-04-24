import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Heart } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { ListingCard } from "@/components/features/listings/listing-card"
import { cn } from "@/lib/utils"

export function FavoritesGrid() {
  const favorites = useQuery(api.favorites.getByUser, {})

  if (favorites === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          You haven't saved any charters yet.
        </p>
        <Link
          to="/search"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Browse charters
        </Link>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((fav) => (
        <ListingCard key={fav._id} listing={fav.listing} />
      ))}
    </div>
  )
}
