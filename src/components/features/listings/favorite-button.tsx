import { useMutation, useQuery } from "convex/react"
import { Link, useRouter } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { buttonVariants } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"
import { useState } from "react"

type Props = {
  listingId: Id<"listings">
  className?: string
}

export function FavoriteButton({ listingId, className }: Props) {
  const { isAuthenticated } = useCurrentUser()
  const isFavorited = useQuery(
    api.favorites.isFavorited,
    isAuthenticated ? { listingId } : "skip",
  )
  const toggle = useMutation(api.favorites.toggle)
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function onClick() {
    if (!isAuthenticated) {
      setDialogOpen(true)
      return
    }
    try {
      await toggle({ listingId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  const active = !!isFavorited

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onClick}
        className={cn(
          "rounded-full",
          active && "border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400",
          className,
        )}
        aria-label={active ? "Remove from favorites" : "Save to favorites"}
      >
        <Heart
          className={cn("h-4 w-4", active && "fill-current")}
        />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this charter</DialogTitle>
            <DialogDescription>
              Sign in to build your list of favorites.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Link
              to="/sign-up"
              className={cn(buttonVariants(), "flex-1")}
              onClick={() => setDialogOpen(false)}
            >
              Create account
            </Link>
            <Link
              to="/sign-in"
              className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
              onClick={() => {
                setDialogOpen(false)
                router.navigate({ to: "/sign-in" })
              }}
            >
              Sign in
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
