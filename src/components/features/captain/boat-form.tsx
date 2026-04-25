import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { PhotoUploader } from "@/components/features/captain/photo-uploader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const BOAT_TYPES = [
  "center_console",
  "sportfisher",
  "pontoon",
  "sailboat",
  "catamaran",
  "kayak",
  "other",
] as const
type BoatType = (typeof BOAT_TYPES)[number]

const TYPE_LABELS: Record<BoatType, string> = {
  center_console: "Center Console",
  sportfisher: "Sportfisher",
  pontoon: "Pontoon",
  sailboat: "Sailboat",
  catamaran: "Catamaran",
  kayak: "Kayak",
  other: "Other",
}

type Props = { boat?: Doc<"boats"> }

export function BoatForm({ boat }: Props) {
  const create = useMutation(api.boats.create)
  const update = useMutation(api.boats.update)
  const navigate = useNavigate()

  const [name, setName] = useState(boat?.name ?? "")
  const [type, setType] = useState<BoatType>(
    (boat?.type as BoatType) ?? "center_console",
  )
  const [lengthFeet, setLengthFeet] = useState(String(boat?.lengthFeet ?? ""))
  const [capacityGuests, setCapacityGuests] = useState(
    String(boat?.capacityGuests ?? ""),
  )
  const [manufacturer, setManufacturer] = useState(boat?.manufacturer ?? "")
  const [model, setModel] = useState(boat?.model ?? "")
  const [registrationNumber, setRegistrationNumber] = useState(
    boat?.registrationNumber ?? "",
  )
  const [description, setDescription] = useState(boat?.description ?? "")
  const [amenitiesText, setAmenitiesText] = useState(
    boat?.amenities?.join(", ") ?? "",
  )
  const [safetyText, setSafetyText] = useState(
    boat?.safetyEquipment?.join(", ") ?? "",
  )
  const [photos, setPhotos] = useState<Array<Id<"_storage">>>(
    (boat?.photos) ?? [],
  )
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name || !lengthFeet || !capacityGuests) return
    setSubmitting(true)
    try {
      const baseArgs = {
        name,
        type,
        lengthFeet: Number.parseFloat(lengthFeet),
        capacityGuests: Number.parseInt(capacityGuests, 10),
        manufacturer: manufacturer || undefined,
        model: model || undefined,
        registrationNumber: registrationNumber || undefined,
        description: description || undefined,
        amenities: amenitiesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        safetyEquipment: safetyText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }
      if (boat) {
        await update({ id: boat._id, ...baseArgs, photos })
        toast.success("Boat updated")
      } else {
        const id = await create(baseArgs)
        if (photos.length > 0) {
          await update({ id, photos })
        }
        toast.success("Boat added")
      }
      navigate({ to: "/captain/boats" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-semibold">Photos</h2>
          <p className="text-sm text-muted-foreground">
            The first photo is the cover that shows in search and on the
            listing page.
          </p>
        </div>
        <PhotoUploader value={photos} onChange={setPhotos} max={12} />
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Boat name" required>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
            />
          </Field>
          <Field id="type" label="Type">
            <Select
              value={type}
              onValueChange={(v) => v && setType(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOAT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="lengthFeet" label="Length (ft)" required>
            <Input
              id="lengthFeet"
              type="number"
              step="0.5"
              value={lengthFeet}
              onChange={(e) => setLengthFeet(e.currentTarget.value)}
              required
            />
          </Field>
          <Field id="capacityGuests" label="Max guests" required>
            <Input
              id="capacityGuests"
              type="number"
              value={capacityGuests}
              onChange={(e) => setCapacityGuests(e.currentTarget.value)}
              required
            />
          </Field>
          <Field id="manufacturer" label="Manufacturer">
            <Input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.currentTarget.value)}
            />
          </Field>
          <Field id="model" label="Model">
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.currentTarget.value)}
            />
          </Field>
          <Field id="registrationNumber" label="Registration #">
            <Input
              id="registrationNumber"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.currentTarget.value)}
            />
          </Field>
        </div>

        <Field id="description" label="Description">
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            placeholder="Tell guests what makes this boat great."
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Amenities & safety</h2>
        <Field id="amenities" label="Amenities (comma separated)">
          <Input
            id="amenities"
            value={amenitiesText}
            onChange={(e) => setAmenitiesText(e.currentTarget.value)}
            placeholder="GPS, Live Well, Bathroom, Bimini, Cooler"
          />
        </Field>
        <Field
          id="safety"
          label="Safety equipment (comma separated)"
        >
          <Input
            id="safety"
            value={safetyText}
            onChange={(e) => setSafetyText(e.currentTarget.value)}
            placeholder="Life Jackets, First Aid Kit, Flares, VHF Radio"
          />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: "/captain/boats" })}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {boat ? "Save changes" : "Add boat"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  )
}
