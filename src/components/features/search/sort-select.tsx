import { useNavigate } from "@tanstack/react-router"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Route as SearchRoute } from "@/routes/search"

type SortBy = "newest" | "price_asc" | "price_desc" | "rating" | "reviews"

const LABELS: Record<SortBy, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Rating",
  reviews: "Most reviewed",
}

export function SortSelect() {
  const navigate = useNavigate()
  const params = SearchRoute.useSearch()
  const value: SortBy = params.sortBy ?? "newest"

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        navigate({
          to: "/search",
          search: (prev) => ({
            ...prev,
            sortBy: (v as SortBy) === "newest" ? undefined : (v as SortBy),
          }),
        })
      }}
    >
      <SelectTrigger size="sm" className="w-auto min-w-44">
        <SelectValue>
          {(v: SortBy) => LABELS[v]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABELS) as Array<SortBy>).map((k) => (
          <SelectItem key={k} value={k}>
            {LABELS[k]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
