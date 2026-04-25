import { useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { Bell, MessageSquare, Phone } from "lucide-react"
import type { Doc } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

type Prefs = NonNullable<Doc<"users">["notificationPreferences"]>

const DEFAULTS: Required<Prefs> = {
  emailBookings: true,
  emailMessages: true,
  emailMarketing: false,
  smsBookings: false,
  smsMessages: false,
}

export function NotificationsForm({ user }: { user: Doc<"users"> }) {
  const update = useMutation(api.users.updateNotificationPreferences)
  const initial: Required<Prefs> = {
    ...DEFAULTS,
    ...(user.notificationPreferences ?? {}),
  }
  const [prefs, setPrefs] = useState<Required<Prefs>>(initial)

  async function set<K extends keyof Required<Prefs>>(
    key: K,
    value: Required<Prefs>[K],
  ) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      await update({ [key]: value })
    } catch (err) {
      setPrefs(prefs)
      toast.error(err instanceof Error ? err.message : "Could not save")
    }
  }

  const phoneMissing = !user.phone && (prefs.smsBookings || prefs.smsMessages)

  return (
    <div className="space-y-6">
      <Section
        icon={<Bell className="h-4 w-4" />}
        title="Email"
        subtitle="Where transactional updates land."
      >
        <Row
          title="Booking updates"
          description="Confirmations, host responses, cancellations."
          checked={prefs.emailBookings}
          onChange={(v) => set("emailBookings", v)}
        />
        <Row
          title="New messages"
          description="When a captain or rider replies."
          checked={prefs.emailMessages}
          onChange={(v) => set("emailMessages", v)}
        />
        <Row
          title="Marketing"
          description="Trip ideas, seasonal picks, occasional product news."
          checked={prefs.emailMarketing}
          onChange={(v) => set("emailMarketing", v)}
        />
      </Section>

      <Section
        icon={<MessageSquare className="h-4 w-4" />}
        title="Text (SMS)"
        subtitle="Standard message rates may apply."
      >
        {!user.phone ? (
          <Card className="border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Add a phone number above to receive SMS updates.
            </div>
          </Card>
        ) : null}
        <Row
          title="Booking updates"
          description="A short confirmation text the day of."
          checked={prefs.smsBookings}
          onChange={(v) => set("smsBookings", v)}
          disabled={!user.phone}
        />
        <Row
          title="New messages"
          description="A heads up when someone replies."
          checked={prefs.smsMessages}
          onChange={(v) => set("smsMessages", v)}
          disabled={!user.phone}
        />
      </Section>

      {phoneMissing ? (
        <p className="text-xs text-muted-foreground">
          Add a phone number on the Account tab to enable SMS.
        </p>
      ) : null}
    </div>
  )
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-muted p-1.5">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

function Row({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border p-3">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
