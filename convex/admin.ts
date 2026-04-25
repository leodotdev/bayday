import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";

const ROLE = v.union(v.literal("guest"), v.literal("host"), v.literal("admin"));

const LISTING_STATUS = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("paused"),
  v.literal("archived"),
  v.literal("rejected")
);

const BOOKING_STATUS = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled_by_guest"),
  v.literal("cancelled_by_host"),
  v.literal("completed"),
  v.literal("no_show"),
  v.literal("disputed")
);

// --- DASHBOARD ---

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, listings, bookings, boats, reviews, conversations] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("listings").collect(),
        ctx.db.query("bookings").collect(),
        ctx.db.query("boats").collect(),
        ctx.db.query("reviews").collect(),
        ctx.db.query("conversations").collect(),
      ]);
    const grossRevenueCents = bookings
      .filter((b) => b.status === "completed" || b.status === "confirmed")
      .reduce((sum, b) => sum + b.totalPriceCents, 0);
    return {
      users: users.length,
      hosts: users.filter((u) => u.role === "host").length,
      admins: users.filter((u) => u.role === "admin").length,
      banned: users.filter((u) => u.isBanned).length,
      listings: listings.length,
      published: listings.filter((l) => l.status === "published").length,
      bookings: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      boats: boats.length,
      reviews: reviews.length,
      conversations: conversations.length,
      grossRevenueCents,
    };
  },
});

// --- USERS ---

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    return users.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const setUserRole = mutation({
  args: { id: v.id("users"), role: ROLE },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("User not found");
    // Hard-prevent demoting leo@leo.dev away from admin
    if (target.email === "leo@leo.dev" && args.role !== "admin") {
      throw new Error("leo@leo.dev must remain admin");
    }
    if (target._id === admin._id && args.role !== "admin") {
      throw new Error("You can't demote yourself");
    }
    await ctx.db.patch(args.id, { role: args.role });
  },
});

export const setUserBanned = mutation({
  args: { id: v.id("users"), banned: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("User not found");
    if (target.email === "leo@leo.dev") {
      throw new Error("Cannot ban the super-user");
    }
    if (target._id === admin._id) {
      throw new Error("You can't ban yourself");
    }
    await ctx.db.patch(args.id, { isBanned: args.banned });
  },
});

export const setUserVerified = mutation({
  args: { id: v.id("users"), verified: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("User not found");
    await ctx.db.patch(args.id, { isVerified: args.verified });
  },
});

// --- LISTINGS ---

export const listListings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const listings = await ctx.db.query("listings").collect();
    const enriched = await Promise.all(
      listings.map(async (l) => {
        const host = await ctx.db.get(l.hostId);
        const boat = await ctx.db.get(l.boatId);
        return { ...l, host, boat };
      })
    );
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setListingStatus = mutation({
  args: { id: v.id("listings"), status: LISTING_STATUS },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const listing = await ctx.db.get(args.id);
    if (!listing) throw new Error("Listing not found");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
  },
});

// --- BOATS ---

export const listBoats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const boats = await ctx.db.query("boats").collect();
    const enriched = await Promise.all(
      boats.map(async (b) => {
        const host = await ctx.db.get(b.hostId);
        return { ...b, host };
      })
    );
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setBoatActive = mutation({
  args: { id: v.id("boats"), active: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const boat = await ctx.db.get(args.id);
    if (!boat) throw new Error("Boat not found");
    await ctx.db.patch(args.id, { isActive: args.active });
  },
});

// --- BOOKINGS ---

export const listBookings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bookings = await ctx.db.query("bookings").collect();
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const listing = await ctx.db.get(b.listingId);
        const host = await ctx.db.get(b.hostId);
        const guest = b.guestId ? await ctx.db.get(b.guestId) : null;
        return { ...b, listing, host, guest };
      })
    );
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setBookingStatus = mutation({
  args: { id: v.id("bookings"), status: BOOKING_STATUS },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// --- REVIEWS ---

export const listReviews = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reviews = await ctx.db.query("reviews").collect();
    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const listing = await ctx.db.get(r.listingId);
        const reviewer = await ctx.db.get(r.reviewerId);
        return { ...r, listing, reviewer };
      })
    );
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setReviewPublished = mutation({
  args: { id: v.id("reviews"), published: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Review not found");
    await ctx.db.patch(args.id, { isPublished: args.published });
  },
});

// --- CONVERSATIONS ---

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const conversations = await ctx.db.query("conversations").collect();
    const enriched = await Promise.all(
      conversations.map(async (c) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", c._id)
          )
          .collect();
        const participants = await Promise.all(
          c.participantIds.map((id) => ctx.db.get(id))
        );
        const listing = c.listingId ? await ctx.db.get(c.listingId) : null;
        return {
          ...c,
          messageCount: messages.length,
          participants: participants.filter((p) => p !== null),
          listing,
        };
      })
    );
    return enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});
