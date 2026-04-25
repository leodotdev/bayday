import { LayoutGrid, Map as MapIcon, SplitSquareHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "list" | "map" | "split"

const OPTIONS: Array<{ value: ViewMode; label: string; icon: typeof MapIcon }> = [
  { value: "list", label: "List", icon: LayoutGrid },
  { value: "split", label: "Split", icon: SplitSquareHorizontal },
  { value: "map", label: "Map", icon: MapIcon },
]

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (next: ViewMode) => void
}) {
  return (
    <div className="inline-flex items-center rounded-full border bg-background p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            value === opt.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={value === opt.value}
        >
          <opt.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
