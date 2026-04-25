import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireHost } from "./helpers";

export const setSlots = mutation({
  args: {
    listingId: v.id("listings"),
    slots: v.array(
      v.object({
        date: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        isAvailable: v.boolean(),
        customPriceCents: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id)
      throw new Error("Listing does not belong to you");

    for (const slot of args.slots) {
      // Check if a slot already exists for this listing + date
      const existing = await ctx.db
        .query("availability")
        .withIndex("by_listingId_date", (q) =>
          q.eq("listingId", args.listingId).eq("date", slot.date)
        )
        .first();

      if (existing) {
        // Update existing slot
        await ctx.db.patch(existing._id, {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          customPriceCents: slot.customPriceCents,
        });
      } else {
        // Create new slot
        await ctx.db.insert("availability", {
          listingId: args.listingId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          customPriceCents: slot.customPriceCents,
        });
      }
    }
  },
});

export const removeSlot = mutation({
  args: {
    id: v.id("availability"),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const slot = await ctx.db.get(args.id);
    if (!slot) throw new Error("Availability slot not found");

    const listing = await ctx.db.get(slot.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id)
      throw new Error("Listing does not belong to you");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const bulkSetAvailable = mutation({
  args: {
    listingId: v.id("listings"),
    dates: v.array(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    customPriceCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id)
      throw new Error("Listing does not belong to you");

    for (const date of args.dates) {
      const existing = await ctx.db
        .query("availability")
        .withIndex("by_listingId_date", (q) =>
          q.eq("listingId", args.listingId).eq("date", date)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          startTime: args.startTime,
          endTime: args.endTime,
          isAvailable: true,
          customPriceCents: args.customPriceCents,
        });
      } else {
        await ctx.db.insert("availability", {
          listingId: args.listingId,
          date,
          startTime: args.startTime,
          endTime: args.endTime,
          isAvailable: true,
          customPriceCents: args.customPriceCents,
        });
      }
    }
  },
});

export const getByListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("availability")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .collect();
  },
});

// Returns availability slots enriched with booking status for the listing calendar.
// Each slot gets a `status` field: "available" | "booked" | "unavailable".
export const getCalendar = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("availability")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .collect();

    // Get confirmed/pending bookings for this listing to mark booked dates
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .collect();

    const bookedDates = new Set<string>();
    for (const b of bookings) {
      if (b.status === "confirmed" || b.status === "pending") {
        bookedDates.add(b.date);
        if (b.endDate) {
          // Mark all dates in range
          const cur = new Date(b.date + "T12:00:00");
          const end = new Date(b.endDate + "T12:00:00");
          while (cur <= end) {
            const y = cur.getFullYear();
            const m = String(cur.getMonth() + 1).padStart(2, "0");
            const d = String(cur.getDate()).padStart(2, "0");
            bookedDates.add(`${y}-${m}-${d}`);
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    }

    return slots.map((slot) => ({
      ...slot,
      status: bookedDates.has(slot.date)
        ? ("booked" as const)
        : slot.isAvailable
          ? ("available" as const)
          : ("unavailable" as const),
    }));
  },
});

export const getByListingAndDateRange = query({
  args: {
    listingId: v.id("listings"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("availability")
      .withIndex("by_listingId_date", (q) =>
        q.eq("listingId", args.listingId).gte("date", args.startDate)
      )
      .collect();

    return slots.filter((slot) => slot.date <= args.endDate);
  },
});
