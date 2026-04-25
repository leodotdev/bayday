import { useState } from "react"
import { useAction } from "convex/react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function FeedbackForm({ user }: { user: Doc<"users"> }) {
  const sendFeedback = useAction(api.email.sendFeedback)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const subject = (form.get("subject") as string) || ""
    const message = (form.get("message") as string) || ""
    if (!subject || !message) return

    setSubmitting(true)
    try {
      const res = await sendFeedback({
        email: user.email ?? "",
        name: user.name ?? user.firstName ?? "Guest",
        subject,
        message,
      })
      if (res.success) {
        toast.success("Thanks — feedback sent")
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error("Could not send feedback")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send feedback
      </Button>
    </form>
  )
}
