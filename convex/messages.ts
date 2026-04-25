import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth } from "./helpers";

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image")
    ),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Not a participant in this conversation");
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body: args.body,
      type: args.type,
      imageId: args.imageId,
      isRead: false,
      createdAt: now,
    });

    // Update conversation with last message info
    const preview =
      args.body.length > 100 ? args.body.substring(0, 100) + "..." : args.body;

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
    });

    // Notify other participants — but only if they haven't been active in
    // the conversation in the last 5 minutes (cheap heuristic to avoid
    // pinging someone who is actively chatting).
    const STALE_AFTER = 5 * 60 * 1000;
    const senderName =
      user.firstName ?? user.name ?? user.email ?? "Someone";
    const otherParticipantIds = conversation.participantIds.filter(
      (id) => id !== user._id,
    );
    for (const recipientId of otherParticipantIds) {
      const recipient = await ctx.db.get(recipientId);
      if (!recipient) continue;
      const lastActivity = conversation.lastMessageAt ?? 0;
      const recentlyActive = now - lastActivity < STALE_AFTER;
      if (recentlyActive) continue;

      const wantsEmail =
        recipient.notificationPreferences?.emailMessages !== false;
      if (recipient.email && wantsEmail) {
        await ctx.scheduler.runAfter(0, internal.email.notifyNewMessage, {
          recipientEmail: recipient.email,
          recipientName: recipient.firstName ?? recipient.name ?? "User",
          senderName,
          messagePreview: preview,
          conversationId: args.conversationId,
        });
      }
      const wantsSms =
        recipient.notificationPreferences?.smsMessages === true;
      if (recipient.phone && wantsSms) {
        await ctx.scheduler.runAfter(0, internal.sms.notifyNewMessage, {
          to: recipient.phone,
          senderName,
          preview,
        });
      }
    }

    return messageId;
  },
});

export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Not a participant in this conversation");
    }

    // Mark all messages from other users as read
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const unread = messages.filter(
      (m) => !m.isRead && m.senderId !== user._id
    );

    for (const message of unread) {
      await ctx.db.patch(message._id, { isRead: true });
    }

    return unread.length;
  },
});

export const sendSystemMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      body: args.body,
      type: "system",
      isRead: false,
      createdAt: now,
    });

    const preview =
      args.body.length > 100 ? args.body.substring(0, 100) + "..." : args.body;

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
    });

    return messageId;
  },
});

export const getByConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];
    if (!conversation.participantIds.includes(user._id)) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const enriched = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return { ...message, sender };
      })
    );

    return enriched;
  },
});

export const getLatest = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];
    if (!conversation.participantIds.includes(user._id)) return [];

    const limit = args.limit ?? 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);

    const enriched = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return { ...message, sender };
      })
    );

    // Return in chronological order
    return enriched.reverse();
  },
});
