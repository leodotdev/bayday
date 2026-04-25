import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useAuthActions } from "@convex-dev/auth/react"
import { toast } from "sonner"
import { Loader2, Mail, Phone as PhoneIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OAuthButtons } from "@/components/features/auth/oauth-buttons"

type Mode = "signIn" | "signUp"

// @convex-dev/auth surfaces unhelpful raw stack traces for common cases.
// Map the worst offenders to friendlier copy so users see one clear line
// instead of a wall of red.
function humanizeAuthError(err: unknown, isSignIn: boolean): string {
  const raw = err instanceof Error ? err.message : String(err)
  // Known crash in @convex-dev/auth@0.0.91 when no account matches.
  if (raw.includes("Cannot read properties of null") && raw.includes("_id")) {
    return isSignIn
      ? "We couldn't find an account with that email and password. Try signing up first."
      : "An account with that email already exists. Try signing in instead."
  }
  if (raw.includes("InvalidAccountId") || raw.includes("Invalid credentials")) {
    return "That email and password don't match an account."
  }
  if (raw.includes("AccountAlreadyExists")) {
    return "An account with that email already exists. Try signing in."
  }
  if (raw.includes("Account suspended")) {
    return "This account has been suspended. Contact support."
  }
  // Strip the stack — keep only the first line for any other server error.
  const firstLine = raw.split(/\r?\n/)[0].replace(/^\[CONVEX[^\]]*\]\s*/, "")
  return firstLine || "Something went wrong. Try again in a moment."
}

export function AuthForm({ mode }: { mode: Mode }) {
  const isSignIn = mode === "signIn"

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isSignIn ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignIn
            ? "Sign in to book charters and manage your trips."
            : "Join DayTrip to start booking fishing charters."}
        </p>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="w-full">
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-1.5">
            <PhoneIcon className="h-3.5 w-3.5" />
            Phone
          </TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="pt-6">
          <EmailFlow mode={mode} />
        </TabsContent>
        <TabsContent value="phone" className="pt-6">
          <PhoneFlow />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <Separator className="flex-1" />
      </div>

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        {isSignIn ? (
          <>
            No account?{" "}
            <Link
              to="/sign-up"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

function EmailFlow({ mode }: { mode: Mode }) {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSignIn = mode === "signIn"

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!isSignIn && password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setSubmitting(true)
    try {
      await signIn("password", { email, password, flow: mode })
      toast.success(isSignIn ? "Welcome back" : "Account created")
      navigate({ to: "/" })
    } catch (err) {
      setError(humanizeAuthError(err, isSignIn))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={isSignIn ? "current-password" : "new-password"}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        {!isSignIn ? (
          <p className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl"
        disabled={submitting}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isSignIn ? "Sign in" : "Create account"}
      </Button>
    </form>
  )
}

function PhoneFlow() {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function normalizePhone(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return trimmed
    return trimmed.startsWith("+") ? trimmed : `+1${trimmed.replace(/\D/g, "")}`
  }

  async function onSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn("phone", { phone: normalizePhone(phone) })
      toast.success("Check your phone for a 6-digit code")
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send code")
    } finally {
      setSubmitting(false)
    }
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn("phone", {
        phone: normalizePhone(phone),
        code: code.replace(/\D/g, ""),
      })
      toast.success("You're signed in")
      navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "phone") {
    return (
      <form onSubmit={onSendCode} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <p className="text-xs text-muted-foreground">
            We'll text you a 6-digit code. Standard rates may apply.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-xl"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send code
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={onVerify} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          className="text-center text-2xl tracking-[0.4em]"
        />
        <p className="text-xs text-muted-foreground">
          Sent to {phone}.{" "}
          <button
            type="button"
            onClick={() => {
              setStep("phone")
              setCode("")
              setError(null)
            }}
            className="text-foreground underline"
          >
            Change number
          </button>
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl"
        disabled={submitting || code.replace(/\D/g, "").length < 6}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Verify and continue
      </Button>
    </form>
  )
}
