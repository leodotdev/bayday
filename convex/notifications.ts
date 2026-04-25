import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./helpers";

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const items = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(40);
    return items;
  },
});

export const unreadCountForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false),
      )
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification) return;
    if (notification.userId !== user._id) return;
    if (notification.isRead) return;
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false),
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
    return unread.length;
  },
});

// Internal helper used by other mutations to drop a notification on a
// user's bell. Use ctx.scheduler.runAfter or call directly in the same
// mutation.
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("booking_request"),
      v.literal("booking_confirmed"),
      v.literal("booking_cancelled"),
      v.literal("new_message"),
      v.literal("new_review"),
      v.literal("cost_share_invite"),
      v.literal("cost_share_joined"),
      v.literal("payout_sent"),
      v.literal("system"),
    ),
    title: v.string(),
    body: v.string(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Public helper for in-mutation use — same signature, but a regular
// mutation so we can call it via ctx.runMutation if needed.
export async function pushInline(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    type:
      | "booking_request"
      | "booking_confirmed"
      | "booking_cancelled"
      | "new_message"
      | "new_review"
      | "cost_share_invite"
      | "cost_share_joined"
      | "payout_sent"
      | "system";
    title: string;
    body: string;
    referenceType?: string;
    referenceId?: string;
  },
) {
  await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    referenceType: args.referenceType,
    referenceId: args.referenceId,
    isRead: false,
    createdAt: Date.now(),
  });
}
