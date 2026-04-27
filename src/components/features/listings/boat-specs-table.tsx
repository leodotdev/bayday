import type { Doc } from "@/convex/_generated/dataModel"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { boatTypeLabel } from "@/lib/format"

type Props = {
  boat: Doc<"boats">
}

export function BoatSpecsTable({ boat }: Props) {
  const rows: Array<[string, string]> = [
    ["Make & Model", [boat.manufacturer, boat.model].filter(Boolean).join(" ") || "—"],
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
    <Table>
      <TableBody>
        {rows.map(([label, value]) => (
          <TableRow key={label}>
            <TableCell className="w-1/3 px-6 text-muted-foreground">
              {label}
            </TableCell>
            <TableCell className="px-6 font-medium">{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
