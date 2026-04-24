import { createFileRoute } from "@tanstack/react-router"
import { AuthForm } from "@/components/features/auth/auth-form"

export const Route = createFileRoute("/sign-in")({
  component: () => <AuthForm mode="signIn" />,
})
