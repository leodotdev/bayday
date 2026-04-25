import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { Loader2, Users } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { PhotoUploader } from "@/components/features/captain/photo-uploader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const TRIP_TYPES = [
  "inshore",
  "offshore",
  "deep_sea",
  "fly_fishing",
  "trolling",
  "bottom_fishing",
  "spearfishing",
  "sunset_cruise",
  "custom",
] as const
type TripType = (typeof TRIP_TYPES)[number]

const TRIP_LABELS: Record<TripType, string> = {
  inshore: "Inshore",
  offshore: "Offshore",
  deep_sea: "Deep Sea",
  fly_fishing: "Fly Fishing",
  trolling: "Trolling",
  bottom_fishing: "Bottom Fishing",
  spearfishing: "Spearfishing",
  sunset_cruise: "Sunset Cruise",
  custom: "Custom",
}

const POLICIES = ["flexible", "moderate", "strict"] as const
type Policy = (typeof POLICIES)[number]

type Props = { listing?: Doc<"listings"> }

export function ListingForm({ listing }: Props) {
  const create = useMutation(api.listings.create)
  const update = useMutation(api.listings.update)
  const boats = useQuery(api.boats.getByHost, {})
  const navigate = useNavigate()

  const [boatId, setBoatId] = useState<string>(listing?.boatId ?? "")
  const [title, setTitle] = useState(listing?.title ?? "")
  const [description, setDescription] = useState(listing?.description ?? "")
  const [tripType, setTripType] = useState<TripType>(
    (listing?.tripType as TripType) ?? "offshore",
  )
  const [durationHours, setDurationHours] = useState(
    String(listing?.durationHours ?? "8"),
  )
  const [priceDollars, setPriceDollars] = useState(
    listing ? String(listing.priceCents / 100) : "",
  )
  const [priceType, setPriceType] = useState<"per_person" | "per_trip">(
    listing?.priceType ?? "per_trip",
  )
  const [maxGuests, setMaxGuests] = useState(String(listing?.maxGuests ?? "6"))
  const [minGuests, setMinGuests] = useState(
    String(listing?.minGuests ?? "1"),
  )
  const [captainIncluded, setCaptainIncluded] = useState(
    listing?.captainIncluded ?? true,
  )
  const [captainName, setCaptainName] = useState(listing?.captainName ?? "")
  const [captainBio, setCaptainBio] = useState(listing?.captainBio ?? "")
  const [captainPhoto, setCaptainPhoto] = useState<Id<"_storage"> | undefined>(
    listing?.captainPhoto as Id<"_storage"> | undefined,
  )
  const [targetSpeciesText, setTargetSpeciesText] = useState(
    listing?.targetSpecies?.join(", ") ?? "",
  )
  const [departurePort, setDeparturePort] = useState(
    listing?.departurePort ?? "",
  )
  const [departureLat, setDepartureLat] = useState(
    listing ? String(listing.departureLatitude) : "",
  )
  const [departureLng, setDepartureLng] = useState(
    listing ? String(listing.departureLongitude) : "",
  )
  const [departureCity, setDepartureCity] = useState(
    listing?.departureCity ?? "",
  )
  const [departureState, setDepartureState] = useState(
    listing?.departureState ?? "",
  )
  const [includesEquipment, setIncludesEquipment] = useState(
    listing?.includesEquipment ?? true,
  )
  const [includesBait, setIncludesBait] = useState(
    listing?.includesBait ?? true,
  )
  const [includesLunch, setIncludesLunch] = useState(
    listing?.includesLunch ?? false,
  )
  const [customInclusionsText, setCustomInclusionsText] = useState(
    listing?.customInclusions?.join(", ") ?? "",
  )
  const [cancellationPolicy, setCancellationPolicy] = useState<Policy>(
    (listing?.cancellationPolicy as Policy) ?? "moderate",
  )
  const [instantBook, setInstantBook] = useState(listing?.instantBook ?? false)
  const [allowCostSharing, setAllowCostSharing] = useState(
    listing?.allowCostSharing ?? true,
  )
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!boatId) {
      toast.error("Pick a boat")
      return
    }
    setSubmitting(true)
    try {
      const baseArgs = {
        title,
        description,
        tripType,
        durationHours: Number.parseFloat(durationHours),
        priceCents: Math.round(Number.parseFloat(priceDollars) * 100),
        priceType,
        maxGuests: Number.parseInt(maxGuests, 10),
        minGuests: Number.parseInt(minGuests, 10),
        captainIncluded,
        captainName: captainName || undefined,
        captainBio: captainBio || undefined,
        captainPhoto,
        targetSpecies: targetSpeciesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        departurePort,
        departureLatitude: Number.parseFloat(departureLat),
        departureLongitude: Number.parseFloat(departureLng),
        departureCity,
        departureState,
        includesEquipment,
        includesBait,
        includesLunch,
        customInclusions: customInclusionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cancellationPolicy,
        instantBook,
        allowCostSharing,
      }
      if (listing) {
        await update({ id: listing._id, ...baseArgs })
        toast.success("Listing updated")
      } else {
        await create({
          boatId: boatId as Id<"boats">,
          ...baseArgs,
        })
        toast.success("Listing created (draft)")
      }
      navigate({ to: "/captain/listings" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!listing ? (
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Pick a boat</h2>
          {boats === undefined ? (
            <p className="text-sm text-muted-foreground">Loading boats…</p>
          ) : boats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need at least one boat first. Add one in the Boats tab.
            </p>
          ) : (
            <Select value={boatId} onValueChange={(v) => v && setBoatId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a boat" />
              </SelectTrigger>
              <SelectContent>
                {boats.map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name} · {b.lengthFeet} ft · up to {b.capacityGuests}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Card>
      ) : null}

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Trip basics</h2>
        <Field id="title" label="Title" required>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />
        </Field>
        <Field id="description" label="Description" required>
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="tripType" label="Trip type">
            <Select
              value={tripType}
              onValueChange={(v) => v && setTripType(v as TripType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TRIP_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="durationHours" label="Duration (hours)">
            <Input
              id="durationHours"
              type="number"
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.currentTarget.value)}
            />
          </Field>
        </div>
        <Field id="targetSpecies" label="Target species (comma separated)">
          <Input
            id="targetSpecies"
            value={targetSpeciesText}
            onChange={(e) => setTargetSpeciesText(e.currentTarget.value)}
            placeholder="Mahi-Mahi, Yellowfin Tuna, Wahoo"
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Pricing & capacity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="priceDollars" label="Price (USD)" required>
            <Input
              id="priceDollars"
              type="number"
              step="1"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.currentTarget.value)}
              required
            />
          </Field>
          <Field id="priceType" label="Price type">
            <Select
              value={priceType}
              onValueChange={(v) =>
                v && setPriceType(v as "per_person" | "per_trip")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_trip">Per trip</SelectItem>
                <SelectItem value="per_person">Per person</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="minGuests" label="Min guests">
            <Input
              id="minGuests"
              type="number"
              value={minGuests}
              onChange={(e) => setMinGuests(e.currentTarget.value)}
            />
          </Field>
          <Field id="maxGuests" label="Max guests">
            <Input
              id="maxGuests"
              type="number"
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.currentTarget.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Departure</h2>
        <Field id="departurePort" label="Marina / dock" required>
          <Input
            id="departurePort"
            value={departurePort}
            onChange={(e) => setDeparturePort(e.currentTarget.value)}
            required
            placeholder="Miami Beach Marina, Slip C-12"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="departureCity" label="City" required>
            <Input
              id="departureCity"
              value={departureCity}
              onChange={(e) => setDepartureCity(e.currentTarget.value)}
              required
            />
          </Field>
          <Field id="departureState" label="State" required>
            <Input
              id="departureState"
              value={departureState}
              onChange={(e) => setDepartureState(e.currentTarget.value)}
              required
              placeholder="FL"
            />
          </Field>
          <Field id="lat" label="Latitude" required>
            <Input
              id="lat"
              type="number"
              step="any"
              value={departureLat}
              onChange={(e) => setDepartureLat(e.currentTarget.value)}
              required
            />
          </Field>
          <Field id="lng" label="Longitude" required>
            <Input
              id="lng"
              type="number"
              step="any"
              value={departureLng}
              onChange={(e) => setDepartureLng(e.currentTarget.value)}
              required
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Captain & inclusions</h2>
        <div>
          <Label>Captain photo</Label>
          <PhotoUploader
            variant="single"
            value={captainPhoto ? [captainPhoto] : []}
            onChange={(next) => setCaptainPhoto(next[0])}
            className="mt-2"
          />
        </div>
        <Field id="captainName" label="Captain name">
          <Input
            id="captainName"
            value={captainName}
            onChange={(e) => setCaptainName(e.currentTarget.value)}
          />
        </Field>
        <Field id="captainBio" label="Captain bio">
          <Textarea
            id="captainBio"
            rows={3}
            value={captainBio}
            onChange={(e) => setCaptainBio(e.currentTarget.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Captain included"
            checked={captainIncluded}
            onChange={setCaptainIncluded}
          />
          <Toggle
            label="Equipment provided"
            checked={includesEquipment}
            onChange={setIncludesEquipment}
          />
          <Toggle
            label="Bait provided"
            checked={includesBait}
            onChange={setIncludesBait}
          />
          <Toggle
            label="Lunch provided"
            checked={includesLunch}
            onChange={setIncludesLunch}
          />
        </div>
        <Field
          id="customInclusions"
          label="Other inclusions (comma separated)"
        >
          <Input
            id="customInclusions"
            value={customInclusionsText}
            onChange={(e) => setCustomInclusionsText(e.currentTarget.value)}
            placeholder="Cooler, Fish Cleaning, Bottled Water"
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-semibold">Booking rules</h2>
        <Field id="cancellation" label="Cancellation policy">
          <Select
            value={cancellationPolicy}
            onValueChange={(v) => v && setCancellationPolicy(v as Policy)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flexible">Flexible</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="strict">Strict</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label className="text-base">Instant book</Label>
              <p className="text-sm text-muted-foreground">
                Confirm bookings automatically without manual approval.
              </p>
            </div>
            <Switch checked={instantBook} onCheckedChange={setInstantBook} />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <Label className="text-base">Allow shared trips</Label>
                <p className="text-sm text-muted-foreground">
                  Let guests open their booking to other anglers and
                  split the cost. You can override this per booking later.
                </p>
              </div>
            </div>
            <Switch
              checked={allowCostSharing}
              onCheckedChange={setAllowCostSharing}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: "/captain/listings" })}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {listing ? "Save changes" : "Create draft"}
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm">
      <span>{label}</span>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
    </label>
  )
}
