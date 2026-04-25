import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\/convex\/(.*)$/,
        replacement: path.resolve(__dirname, "convex") + "/$1",
      },
      {
        find: /^@\/(.*)$/,
        replacement: path.resolve(__dirname, "src") + "/$1",
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
