import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth } from "./helpers";

export const createOrGet = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db.get(userId);
    if (!existing) return null;

    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email ?? undefined;

    const patch: Record<string, any> = {};
    if (!existing.role) patch.role = "guest";
    if (existing.isVerified === undefined) patch.isVerified = false;
    if (existing.isBanned === undefined) patch.isBanned = false;
    if (!existing.createdAt) patch.createdAt = Date.now();
    if (args.firstName && !existing.firstName) patch.firstName = args.firstName;
    if (args.lastName && !existing.lastName) patch.lastName = args.lastName;
    if (args.phone && !existing.phone) patch.phone = args.phone;
    if (email && !existing.email) patch.email = email;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
    }
    return existing._id;
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const { avatarStorageId, ...rest } = args;
    const patch: Record<string, any> = { ...rest };

    if (avatarStorageId) {
      const url = await ctx.storage.getUrl(avatarStorageId);
      if (url) patch.avatarUrl = url;
    }

    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

export const upgradeToHost = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    if (user.role === "host" || user.role === "admin") return user._id;
    await ctx.db.patch(user._id, { role: "host" });
    return user._id;
  },
});
