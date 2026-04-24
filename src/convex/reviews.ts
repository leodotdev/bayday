import { v } from "convex/values";
import { query } from "./_generated/server";

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
