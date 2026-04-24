import { Apple, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OAuthButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        type="button"
        disabled
        className="gap-2"
        title="Coming soon"
      >
        <Apple className="h-4 w-4" />
        Apple
      </Button>
      <Button
        variant="outline"
        type="button"
        disabled
        className="gap-2"
        title="Coming soon"
      >
        <Globe className="h-4 w-4" />
        Google
      </Button>
    </div>
  )
}
