import type { Doc } from "@/convex/_generated/dataModel"
import { boatTypeLabel } from "@/lib/format"

type Props = {
  boat: Doc<"boats">
}

export function BoatSpecsTable({ boat }: Props) {
  const rows: Array<[string, string]> = [
    [
      "Make & Model",
      [boat.manufacturer, boat.model].filter(Boolean).join(" ") || "—",
    ],
    ["Type", boatTypeLabel(boat.type)],
    ["Length", `${boat.lengthFeet} ft`],
    ["Capacity", `${boat.capacityGuests} guests`],
  ]
  if (boat.registrationNumber) {
    rows.push(["Registration", boat.registrationNumber])
  }
  if (boat.amenities.length) {
    rows.push(["Amenities", boat.amenities.join(", ")])
  }
  if (boat.safetyEquipment.length) {
    rows.push(["Safety Equipment", boat.safetyEquipment.join(", ")])
  }

  return (
    <dl className="divide-y text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[8rem_1fr] gap-4 px-6 py-3 sm:grid-cols-[12rem_1fr]"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
