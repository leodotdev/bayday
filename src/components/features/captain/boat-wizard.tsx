import { useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ImageIcon,
  Link2,
  Loader2,
  Minus,
  Plus,
  Upload,
} from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
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
import { PhotoUploader } from "@/components/features/captain/photo-uploader"
import { WizardStepper } from "@/components/features/captain/wizard-stepper"

const STEPS = [
  "Basics & photos",
  "Details & features",
  "Review & publish",
] as const

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

export function BoatWizard() {
  const create = useMutation(api.boats.create)
  const update = useMutation(api.boats.update)
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [type, setType] = useState<BoatType>("center_console")
  const [lengthFeet, setLengthFeet] = useState("")
  const [capacity, setCapacity] = useState(6)
  const [manufacturer, setManufacturer] = useState("")
  const [model, setModel] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [description, setDescription] = useState("")
  const [amenitiesText, setAmenitiesText] = useState("")
  const [safetyText, setSafetyText] = useState("")
  const [photos, setPhotos] = useState<Array<Id<"_storage">>>([])

  function canAdvance(): boolean {
    if (step === 0) return name.trim() !== "" && lengthFeet.trim() !== ""
    return true
  }

  function next() {
    if (!canAdvance()) {
      toast.error("Fill in the required fields to continue")
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  function back() {
    if (step === 0) {
      navigate({ to: "/captain/boats" })
      return
    }
    setStep((s) => Math.max(0, s - 1))
  }

  async function submit() {
    setSubmitting(true)
    try {
      const id = await create({
        name,
        type,
        lengthFeet: Number.parseFloat(lengthFeet),
        capacityGuests: capacity,
        manufacturer: manufacturer || undefined,
        model: model || undefined,
        registrationNumber: registrationNumber || undefined,
        description: description || undefined,
        amenities: parseList(amenitiesText),
        safetyEquipment: parseList(safetyText),
      })
      if (photos.length > 0) {
        await update({ id, photos })
      }
      toast.success("Boat added")
      navigate({ to: "/captain/boats" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add boat")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
          <WizardStepper steps={STEPS} active={step} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
        <div className="mb-8 max-w-2xl space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            List your boat
          </h1>
          <p className="text-muted-foreground">{stepCopy(step)}</p>
        </div>

        {step === 0 ? (
          <div className="space-y-6">
            <BasicsStep
              name={name}
              setName={setName}
              type={type}
              setType={setType}
              lengthFeet={lengthFeet}
              setLengthFeet={setLengthFeet}
              capacity={capacity}
              setCapacity={setCapacity}
              manufacturer={manufacturer}
              setManufacturer={setManufacturer}
              model={model}
              setModel={setModel}
            />
            <PhotosStep photos={photos} onChange={setPhotos} />
          </div>
        ) : null}

        {step === 1 ? (
          <DetailsStep
            description={description}
            setDescription={setDescription}
            amenitiesText={amenitiesText}
            setAmenitiesText={setAmenitiesText}
            safetyText={safetyText}
            setSafetyText={setSafetyText}
            registrationNumber={registrationNumber}
            setRegistrationNumber={setRegistrationNumber}
          />
        ) : null}

        {step === 2 ? (
          <ReviewStep
            name={name}
            type={type}
            lengthFeet={lengthFeet}
            capacity={capacity}
            manufacturer={manufacturer}
            model={model}
            registrationNumber={registrationNumber}
            description={description}
            amenities={parseList(amenitiesText)}
            safetyEquipment={parseList(safetyText)}
            photoCount={photos.length}
          />
        ) : null}
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={submitting}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Add boat
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

function stepCopy(step: number): string {
  switch (step) {
    case 0:
      return "Tell anglers what kind of boat they'll be on and show it off — clean, well-lit photos book more trips."
    case 1:
      return "Add the details that help anglers know what to expect on board."
    case 2:
      return "Review what you've entered, then add your boat to your fleet."
    default:
      return ""
  }
}

function parseList(text: string): Array<string> {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function BasicsStep(props: {
  name: string
  setName: (v: string) => void
  type: BoatType
  setType: (v: BoatType) => void
  lengthFeet: string
  setLengthFeet: (v: string) => void
  capacity: number
  setCapacity: (v: number) => void
  manufacturer: string
  setManufacturer: (v: string) => void
  model: string
  setModel: (v: string) => void
}) {
  const {
    name,
    setName,
    type,
    setType,
    lengthFeet,
    setLengthFeet,
    capacity,
    setCapacity,
    manufacturer,
    setManufacturer,
    model,
    setModel,
  } = props

  return (
    <Card className="space-y-6 p-6 sm:p-8">
      <Field label="Boat name" required help={`${name.length} / 50`}>
        <Input
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="36ft Contender Sportfisher"
          required
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Boat type">
          <Select value={type} onValueChange={(v) => setType(v as BoatType)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: BoatType) => TYPE_LABELS[v]}
              </SelectValue>
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

        <Field label="Length" required help="In feet.">
          <div className="relative">
            <Input
              type="number"
              step="0.5"
              min="0"
              value={lengthFeet}
              onChange={(e) => setLengthFeet(e.currentTarget.value)}
              placeholder="36"
              className="pr-10"
              required
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              ft
            </span>
          </div>
        </Field>
      </div>

      <Field
        label="Capacity"
        help="How many guests can your boat accommodate?"
      >
        <div className="inline-flex items-center gap-3 rounded-2xl border p-1 pr-3">
          <button
            type="button"
            onClick={() => setCapacity(Math.max(1, capacity - 1))}
            disabled={capacity <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Fewer guests"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[3ch] text-center text-base font-semibold tabular-nums">
            {capacity}
          </span>
          <button
            type="button"
            onClick={() => setCapacity(Math.min(50, capacity + 1))}
            disabled={capacity >= 50}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="More guests"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Manufacturer" help="Optional.">
          <Input
            value={manufacturer}
            onChange={(e) => setManufacturer(e.currentTarget.value)}
            placeholder="Contender"
          />
        </Field>
        <Field label="Model" help="Optional.">
          <Input
            value={model}
            onChange={(e) => setModel(e.currentTarget.value)}
            placeholder="36ST"
          />
        </Field>
      </div>
    </Card>
  )
}

function PhotosStep({
  photos,
  onChange,
}: {
  photos: Array<Id<"_storage">>
  onChange: (next: Array<Id<"_storage">>) => void
}) {
  if (photos.length === 0) {
    return <PhotoEmptyState onChange={onChange} />
  }
  return (
    <Card className="space-y-4 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Your photos</h2>
        <p className="text-xs text-muted-foreground">
          First photo is the cover. Hover a photo to reorder or remove.
        </p>
      </div>
      <PhotoUploader value={photos} onChange={onChange} max={12} />
    </Card>
  )
}

function PhotoEmptyState({
  onChange,
}: {
  onChange: (next: Array<Id<"_storage">>) => void
}) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pasteUrl, setPasteUrl] = useState("")

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const ids: Array<Id<"_storage">> = []
      for (const file of Array.from(files).slice(0, 12)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is over 10 MB — pick a smaller image`)
          continue
        }
        const url = await generateUploadUrl()
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })
        if (!res.ok) {
          toast.error(`Upload failed for ${file.name}`)
          continue
        }
        const { storageId } = (await res.json()) as {
          storageId: Id<"_storage">
        }
        ids.push(storageId)
      }
      if (ids.length > 0) {
        onChange(ids)
        toast.success(
          `${ids.length} photo${ids.length === 1 ? "" : "s"} added`,
        )
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleUrl(rawUrl: string) {
    const url = rawUrl.trim()
    if (!url) return
    setUploading(true)
    try {
      let blob: Blob
      try {
        const res = await fetch(url, { mode: "cors" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        blob = await res.blob()
      } catch {
        toast.error("Could not fetch that URL — try a direct image link")
        return
      }
      if (!blob.type.startsWith("image/")) {
        toast.error("That URL didn't return an image")
        return
      }
      if (blob.size > 10 * 1024 * 1024) {
        toast.error("Image is over 10 MB")
        return
      }
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      })
      if (!result.ok) {
        toast.error("Upload failed")
        return
      }
      const { storageId } = (await result.json()) as {
        storageId: Id<"_storage">
      }
      onChange([storageId])
      toast.success("Photo added from URL")
      setPasteUrl("")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="bg-primary/5 p-6 sm:p-10">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.currentTarget.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFiles(e.dataTransfer.files)
            }}
            className={
              "flex aspect-[5/4] w-full flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed bg-background/60 p-8 text-center transition-colors " +
              (dragging
                ? "border-primary bg-primary/10"
                : "border-primary/40 hover:bg-background/80")
            }
          >
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ImageIcon className="h-10 w-10" />
              </div>
              <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Camera className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-semibold">
                Upload high-quality photos of your boat
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop photos here, or click to browse.
                <br className="hidden sm:inline" />
                We recommend at least 6 photos.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload photos"}
            </span>
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            JPG, PNG, or WebP up to 10 MB each. You can reorder photos
            after uploading.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleUrl(pasteUrl)
            }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                inputMode="url"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.currentTarget.value)}
                placeholder="…or paste an image URL"
                className="pl-9"
                disabled={uploading}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={uploading || !pasteUrl.trim()}
            >
              Add
            </Button>
          </form>
        </div>

        <aside className="space-y-4 border-t bg-card p-6 sm:p-8 lg:border-l lg:border-t-0">
          <h3 className="font-heading text-lg font-semibold">Photo tips</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <Tip>
              Shoot in <strong className="text-foreground">good light</strong>{" "}
              — golden hour beats midday glare.
            </Tip>
            <Tip>
              Show the{" "}
              <strong className="text-foreground">
                deck, helm, and seating
              </strong>{" "}
              so guests know where they'll spend the day.
            </Tip>
            <Tip>
              Add an action shot of your boat{" "}
              <strong className="text-foreground">on the water</strong> — it
              builds trust fast.
            </Tip>
            <Tip>
              Skip clutter. Tidy decks and clean coolers earn bookings.
            </Tip>
          </ul>
        </aside>
      </div>
    </Card>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  )
}

function DetailsStep(props: {
  description: string
  setDescription: (v: string) => void
  amenitiesText: string
  setAmenitiesText: (v: string) => void
  safetyText: string
  setSafetyText: (v: string) => void
  registrationNumber: string
  setRegistrationNumber: (v: string) => void
}) {
  const {
    description,
    setDescription,
    amenitiesText,
    setAmenitiesText,
    safetyText,
    setSafetyText,
    registrationNumber,
    setRegistrationNumber,
  } = props
  return (
    <Card className="space-y-6 p-6 sm:p-8">
      <Field label="Description" help="Tell guests what makes this boat great.">
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          placeholder="A 36ft Contender built for offshore fights — twin Mercury 300s, full T-top, and a roomy cockpit for up to six anglers."
        />
      </Field>

      <Field
        label="Amenities"
        help="Comma separated. Shown as chips on the listing page."
      >
        <Input
          value={amenitiesText}
          onChange={(e) => setAmenitiesText(e.currentTarget.value)}
          placeholder="GPS, Live Well, Bathroom, Bimini, Cooler"
        />
      </Field>

      <Field
        label="Safety equipment"
        help="Comma separated. Builds trust with first-time anglers."
      >
        <Input
          value={safetyText}
          onChange={(e) => setSafetyText(e.currentTarget.value)}
          placeholder="Life Jackets, First Aid Kit, Flares, VHF Radio"
        />
      </Field>

      <Field label="Registration number" help="Optional. Visible to staff only.">
        <Input
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.currentTarget.value)}
          placeholder="FL-1234-AB"
        />
      </Field>
    </Card>
  )
}

function ReviewStep(props: {
  name: string
  type: BoatType
  lengthFeet: string
  capacity: number
  manufacturer: string
  model: string
  registrationNumber: string
  description: string
  amenities: ReadonlyArray<string>
  safetyEquipment: ReadonlyArray<string>
  photoCount: number
}) {
  const rows: Array<[string, string]> = [
    ["Name", props.name || "—"],
    ["Type", TYPE_LABELS[props.type]],
    ["Length", props.lengthFeet ? `${props.lengthFeet} ft` : "—"],
    ["Capacity", `${props.capacity} guests`],
    ["Make / model", [props.manufacturer, props.model].filter(Boolean).join(" ") || "—"],
    ["Registration", props.registrationNumber || "—"],
    ["Photos", `${props.photoCount} uploaded`],
    [
      "Amenities",
      props.amenities.length > 0 ? props.amenities.join(", ") : "—",
    ],
    [
      "Safety equipment",
      props.safetyEquipment.length > 0
        ? props.safetyEquipment.join(", ")
        : "—",
    ],
  ]

  return (
    <Card className="space-y-4 p-6 sm:p-8">
      <h2 className="font-semibold">Looks good?</h2>
      <dl className="divide-y">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_2fr] gap-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {props.description ? (
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Description</div>
          <p className="rounded-xl border bg-muted/40 p-3 text-sm leading-relaxed">
            {props.description}
          </p>
        </div>
      ) : null}
    </Card>
  )
}

function Field({
  label,
  help,
  required,
  children,
}: {
  label: string
  help?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {help ? (
        <p className="text-xs text-muted-foreground">{help}</p>
      ) : null}
    </div>
  )
}
