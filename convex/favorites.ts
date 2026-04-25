import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { optionalAuth, requireAuth } from "./helpers";

export const toggle = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_listingId", (q) =>
        q.eq("userId", user._id).eq("listingId", args.listingId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }

    await ctx.db.insert("favorites", {
      userId: user._id,
      listingId: args.listingId,
      createdAt: Date.now(),
    });

    return { favorited: true };
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalAuth(ctx);
    if (!user) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        const listing = await ctx.db.get(fav.listingId);
        if (!listing || listing.status !== "published") return null;

        const boat = await ctx.db.get(listing.boatId);
        const host = await ctx.db.get(listing.hostId);

        return {
          ...fav,
          listing: { ...listing, boat, host },
        };
      })
    );

    return enriched.filter((f) => f !== null);
  },
});

export const isFavorited = query({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const user = await optionalAuth(ctx);
    if (!user) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_listingId", (q) =>
        q.eq("userId", user._id).eq("listingId", args.listingId)
      )
      .first();

    return existing !== null;
  },
});
