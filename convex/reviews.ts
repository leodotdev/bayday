import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";

const CATEGORY_KEYS = [
  "ratingFishing",
  "ratingBoat",
  "ratingCaptain",
  "ratingValue",
] as const;

export const getByListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const sorted = reviews.sort((a, b) => b.createdAt - a.createdAt);

    const enriched = await Promise.all(
      sorted.map(async (r) => {
        const reviewer = await ctx.db.get(r.reviewerId);
        const host =
          r.hostResponse && r.hostId ? await ctx.db.get(r.hostId) : null;
        const booking = await ctx.db.get(r.bookingId);
        const photoUrls = r.photos
          ? (
              await Promise.all(
                r.photos.map((id) => ctx.storage.getUrl(id))
              )
            ).filter((u): u is string => Boolean(u))
          : [];
        return {
          ...r,
          photoUrls,
          tripDate: booking?.date ?? null,
          reviewer: reviewer
            ? {
                _id: reviewer._id,
                firstName: reviewer.firstName,
                lastName: reviewer.lastName,
                avatarUrl: reviewer.avatarUrl,
                city: reviewer.city,
              }
            : null,
          host: host
            ? {
                _id: host._id,
                firstName: host.firstName,
                lastName: host.lastName,
                avatarUrl: host.avatarUrl,
              }
            : null,
        };
      })
    );

    // Aggregate summary
    const count = enriched.length;
    const sum = enriched.reduce((acc, r) => acc + r.rating, 0);
    const average = count > 0 ? sum / count : 0;

    // Distribution: index 0 = 1-star, index 4 = 5-star
    const breakdown = [0, 0, 0, 0, 0];
    for (const r of enriched) {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      breakdown[bucket]++;
    }

    const categories: Record<string, number | null> = {
      fishing: avgOf(enriched, "ratingFishing"),
      boat: avgOf(enriched, "ratingBoat"),
      captain: avgOf(enriched, "ratingCaptain"),
      value: avgOf(enriched, "ratingValue"),
    };

    return {
      reviews: enriched,
      summary: {
        count,
        average: Math.round(average * 10) / 10,
        breakdown,
        categories,
      },
    };
  },
});

function avgOf(
  reviews: Array<Record<string, unknown>>,
  key: (typeof CATEGORY_KEYS)[number]
): number | null {
  const values = reviews
    .map((r) => r[key])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export const getByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();
    return review;
  },
});

export const create = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(),
    ratingFishing: v.optional(v.number()),
    ratingBoat: v.optional(v.number()),
    ratingCaptain: v.optional(v.number()),
    ratingValue: v.optional(v.number()),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.guestId !== user._id) {
      throw new Error("Only the guest who booked can review");
    }
    if (booking.status !== "completed") {
      throw new Error("You can only review completed trips");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();
    if (existing) {
      throw new Error("You've already reviewed this trip");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    if (!args.title.trim() || !args.body.trim()) {
      throw new Error("Title and body are required");
    }

    const reviewId = await ctx.db.insert("reviews", {
      bookingId: args.bookingId,
      listingId: booking.listingId,
      reviewerId: user._id,
      hostId: booking.hostId,
      rating: args.rating,
      ratingFishing: args.ratingFishing,
      ratingBoat: args.ratingBoat,
      ratingCaptain: args.ratingCaptain,
      ratingValue: args.ratingValue,
      title: args.title.trim(),
      body: args.body.trim(),
      isPublished: true,
      createdAt: Date.now(),
    });

    // Update aggregate rating on the listing
    const listing = await ctx.db.get(booking.listingId);
    if (listing) {
      const allReviews = await ctx.db
        .query("reviews")
        .withIndex("by_listingId", (q) =>
          q.eq("listingId", booking.listingId)
        )
        .filter((q) => q.eq(q.field("isPublished"), true))
        .collect();
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = allReviews.length > 0 ? sum / allReviews.length : 0;
      await ctx.db.patch(booking.listingId, {
        averageRating: Math.round(avg * 10) / 10,
        reviewCount: allReviews.length,
        updatedAt: Date.now(),
      });
    }

    return reviewId;
  },
});
