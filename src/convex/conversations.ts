import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, optionalAuth } from "./helpers";

export const getOrCreateInquiry = mutation({
  args: {
    listingId: v.id("listings"),
    hostId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if an inquiry conversation already exists between this user and host for this listing
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId))
      .collect();

    const found = existing.find(
      (c) =>
        c.type === "inquiry" &&
        c.participantIds.includes(user._id) &&
        c.participantIds.includes(args.hostId)
    );

    if (found) return found._id;

    const now = Date.now();
    return ctx.db.insert("conversations", {
      listingId: args.listingId,
      participantIds: [user._id, args.hostId],
      type: "inquiry",
      lastMessageAt: now,
      isArchived: false,
      createdAt: now,
    });
  },
});

export const createForBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    listingId: v.id("listings"),
    hostId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if a booking conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    return ctx.db.insert("conversations", {
      bookingId: args.bookingId,
      listingId: args.listingId,
      participantIds: [user._id, args.hostId],
      type: "booking",
      lastMessageAt: now,
      isArchived: false,
      createdAt: now,
    });
  },
});

export const archive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Not a participant in this conversation");
    }

    await ctx.db.patch(args.id, { isArchived: true });
    return args.id;
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalAuth(ctx);
    if (!user) return [];

    // Get all conversations - we need to filter by participant
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageAt")
      .order("desc")
      .collect();

    const userConversations = allConversations.filter(
      (c) => c.participantIds.includes(user._id) && !c.isArchived
    );

    const enriched = await Promise.all(
      userConversations.map(async (conversation) => {
        // Find the other user
        const otherUserId = conversation.participantIds.find(
          (id) => id !== user._id
        );
        const otherUser = otherUserId
          ? await ctx.db.get(otherUserId)
          : null;

        // Get listing title if available
        let listingTitle: string | null = null;
        if (conversation.listingId) {
          const listing = await ctx.db.get(conversation.listingId);
          listingTitle = listing?.title ?? null;
        }

        // Count unread messages
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        const unreadCount = messages.filter(
          (m) => !m.isRead && m.senderId !== user._id
        ).length;

        return {
          ...conversation,
          otherUser,
          listingTitle,
          unreadCount,
        };
      })
    );

    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) return null;
    if (!conversation.participantIds.includes(user._id)) return null;

    const otherUserId = conversation.participantIds.find(
      (id) => id !== user._id
    );
    const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

    let listing = null;
    if (conversation.listingId) {
      listing = await ctx.db.get(conversation.listingId);
    }

    let booking = null;
    if (conversation.bookingId) {
      booking = await ctx.db.get(conversation.bookingId);
    }

    return { ...conversation, otherUser, listing, booking };
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageAt")
      .collect();

    const userConversations = allConversations.filter(
      (c) => c.participantIds.includes(user._id) && !c.isArchived
    );

    let totalUnread = 0;

    for (const conversation of userConversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();

      totalUnread += messages.filter(
        (m) => !m.isRead && m.senderId !== user._id
      ).length;
    }

    return totalUnread;
  },
});
