import { createFileRoute } from "@tanstack/react-router"
import { HostGuard } from "@/components/features/captain/host-guard"
import { BoatWizard } from "@/components/features/captain/boat-wizard"

export const Route = createFileRoute("/captain/boats/new")({
  component: () => (
    <HostGuard>
      <BoatWizard />
    </HostGuard>
  ),
})
