import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  user: Doc<"users">
}

export function ProfileForm({ user }: Props) {
  const updateProfile = useMutation(api.users.updateProfile)
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!result.ok) throw new Error("Upload failed")
      const { storageId } = (await result.json()) as {
        storageId: Id<"_storage">
      }
      await updateProfile({ avatarStorageId: storageId })
      toast.success("Avatar updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    try {
      await updateProfile({
        firstName: (form.get("firstName") as string) || undefined,
        lastName: (form.get("lastName") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        bio: (form.get("bio") as string) || undefined,
      })
      toast.success("Profile saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ?? user.email ?? "Avatar"}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Upload new photo
          </Button>
          <p className="text-xs text-muted-foreground">JPG or PNG, up to 5 MB.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={user.firstName ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={user.lastName ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            placeholder="you@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Where booking confirmations and chat updates go.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            placeholder="+1 (555) 123-4567"
          />
          <p className="text-xs text-muted-foreground">
            Required for SMS notifications.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={4} defaultValue={user.bio ?? ""} />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  )
}
