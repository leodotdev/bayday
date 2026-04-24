import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import type { QueryClient } from "@tanstack/react-query"
import type { ConvexQueryClient } from "@convex-dev/react-query"
import { routeTree } from "./routeTree.gen"
import {
  createConvexQueryClient,
  createQueryClient,
} from "./lib/query-client"

export interface RouterContext {
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}

export function getRouter() {
  const convexQueryClient = createConvexQueryClient()
  const queryClient = createQueryClient(convexQueryClient)

  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
      convexQueryClient,
    } satisfies RouterContext,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
