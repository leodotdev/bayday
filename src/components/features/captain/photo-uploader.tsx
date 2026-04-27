import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { GripVertical, Link2, Loader2, Plus, Trash2, Upload } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SignedImage } from "@/components/features/listings/signed-image"
import { cn } from "@/lib/utils"

type Props = {
  value: Array<Id<"_storage">>
  onChange: (next: Array<Id<"_storage">>) => void
  max?: number
  /** "grid" for boats (multi-photo), "single" for captain headshot */
  variant?: "grid" | "single"
  className?: string
}

const ACCEPT = "image/jpeg,image/png,image/webp"
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export function PhotoUploader({
  value,
  onChange,
  max = 12,
  variant = "grid",
  className,
}: Props) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadOne(file: File): Promise<Id<"_storage"> | null> {
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} is over 10 MB — pick a smaller image`)
      return null
    }
    const url = await generateUploadUrl()
    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    })
    if (!result.ok) {
      toast.error(`Upload failed for ${file.name}`)
      return null
    }
    const { storageId } = (await result.json()) as {
      storageId: Id<"_storage">
    }
    return storageId
  }

  // Fetches an external image URL client-side and pipes the blob into
  // Convex storage. Falls down on origins without permissive CORS, in
  // which case we surface the error so the user can pick a different
  // host or paste the file instead.
  async function uploadFromUrl(url: string): Promise<Id<"_storage"> | null> {
    let blob: Blob
    try {
      const res = await fetch(url, { mode: "cors" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      blob = await res.blob()
    } catch {
      toast.error("Could not fetch that URL — try a direct image link")
      return null
    }
    if (!blob.type.startsWith("image/")) {
      toast.error("That URL didn't return an image")
      return null
    }
    if (blob.size > MAX_BYTES) {
      toast.error("Image is over 10 MB")
      return null
    }
    const file = new File([blob], "pasted", { type: blob.type })
    return uploadOne(file)
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const remaining = max - value.length
    const picked = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const ids: Array<Id<"_storage">> = []
      for (const f of picked) {
        const id = await uploadOne(f)
        if (id) ids.push(id)
      }
      onChange([...value, ...ids])
      if (ids.length > 0) {
        toast.success(`${ids.length} photo${ids.length === 1 ? "" : "s"} added`)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function onUrl(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    if (value.length >= max) {
      toast.error(`Already at the ${max}-photo limit`)
      return
    }
    setUploading(true)
    try {
      const id = await uploadFromUrl(trimmed)
      if (id) {
        onChange([...value, id])
        toast.success("Photo added from URL")
      }
    } finally {
      setUploading(false)
    }
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...value]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  if (variant === "single") {
    const photo = value[0]
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          <SignedImage
            storageId={photo}
            alt="Captain photo"
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => onFiles(e.currentTarget.files)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {photo ? "Replace" : "Upload photo"}
            </Button>
            {photo ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
                className="text-destructive"
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP up to 10 MB.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.currentTarget.files)}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {value.map((id, i) => (
          <div
            key={id}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
          >
            <SignedImage
              storageId={id}
              alt={`Photo ${i + 1}`}
              className="absolute inset-0 h-full w-full"
            />
            {i === 0 ? (
              <div className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                Cover
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-md bg-background/90 p-1 text-foreground hover:bg-background disabled:opacity-40"
                  aria-label="Move left"
                  title="Move left"
                >
                  <GripVertical className="h-3.5 w-3.5 -rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="rounded-md bg-background/90 p-1 text-foreground hover:bg-background disabled:opacity-40"
                  aria-label="Move right"
                  title="Move right"
                >
                  <GripVertical className="h-3.5 w-3.5 rotate-90" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-md bg-background/90 p-1 text-destructive hover:bg-background"
                aria-label="Remove"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {value.length < max ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
            {uploading
              ? "Uploading…"
              : value.length === 0
                ? "Upload photos"
                : "Add photo"}
          </button>
        ) : null}
      </div>

      <UrlPasteRow disabled={uploading || value.length >= max} onSubmit={onUrl} />

      <p className="text-xs text-muted-foreground">
        {value.length} / {max} photos · drag to reorder later, first photo
        is the cover. JPG, PNG, or WebP up to 10 MB each.
      </p>
    </div>
  )
}

function UrlPasteRow({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (url: string) => Promise<void> | void
}) {
  const [url, setUrl] = useState("")
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit(url)
        setUrl("")
      }}
      className="flex items-center gap-2"
    >
      <div className="relative flex-1">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          placeholder="…or paste an image URL"
          className="pl-9"
          disabled={disabled}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={disabled || !url.trim()}
      >
        Add
      </Button>
    </form>
  )
}
