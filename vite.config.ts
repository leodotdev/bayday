import path from "node:path"
import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import viteTsConfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"

const config = defineConfig({
  resolve: {
    alias: [
      // Explicit @/convex/* alias takes priority over the generic @/* below
      // because vite-tsconfig-paths doesn't reliably honor longest-match
      // among overlapping prefix aliases.
      {
        find: /^@\/convex\/(.*)$/,
        replacement: path.resolve(__dirname, "convex") + "/$1",
      },
    ],
  },
  plugins: [
    devtools(),
    nitro(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
