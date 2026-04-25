import { describe, expect, it } from "vitest"
import {
  boatTypeLabel,
  formatDateOnly,
  formatDuration,
  formatPriceCents,
  parseDateOnly,
  toDateOnly,
  tripTypeLabel,
} from "./format"

describe("formatPriceCents", () => {
  it("formats whole-dollar amounts with no cents when hideCents is on", () => {
    expect(formatPriceCents(120000, { hideCents: true })).toBe("$1,200")
  })
  it("keeps cents when amount is not whole", () => {
    expect(formatPriceCents(123456, { hideCents: true })).toBe("$1,234.56")
  })
  it("defaults to two decimal places", () => {
    expect(formatPriceCents(99)).toBe("$0.99")
  })
})

describe("formatDuration", () => {
  it("renders sub-day durations in hours", () => {
    expect(formatDuration(8)).toBe("8h")
  })
  it("renders multi-day durations as days", () => {
    expect(formatDuration(48)).toBe("2d")
  })
  it("renders mixed day-and-hour", () => {
    expect(formatDuration(30)).toBe("1d 6h")
  })
})

describe("date helpers", () => {
  it("round-trips toDateOnly + parseDateOnly without timezone drift", () => {
    const d = parseDateOnly("2026-05-15")
    expect(toDateOnly(d)).toBe("2026-05-15")
  })
  it("formats a YYYY-MM-DD string", () => {
    expect(formatDateOnly("2026-05-15")).toMatch(/May 15, 2026/)
  })
})

describe("label helpers", () => {
  it("returns labels for known trip types", () => {
    expect(tripTypeLabel("deep_sea")).toBe("Deep Sea")
    expect(tripTypeLabel("fly_fishing")).toBe("Fly Fishing")
  })
  it("falls back to the raw value for unknown trip types", () => {
    expect(tripTypeLabel("unknown_xyz")).toBe("unknown_xyz")
  })
  it("returns labels for known boat types", () => {
    expect(boatTypeLabel("center_console")).toBe("Center Console")
    expect(boatTypeLabel("kayak")).toBe("Kayak")
  })
})
