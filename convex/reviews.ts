import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./helpers";

export const getByListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("reviews")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
  },
});

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
