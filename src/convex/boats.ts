import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireHost } from "./helpers";

const boatType = v.union(
  v.literal("center_console"),
  v.literal("sportfisher"),
  v.literal("pontoon"),
  v.literal("sailboat"),
  v.literal("catamaran"),
  v.literal("kayak"),
  v.literal("other")
);

export const create = mutation({
  args: {
    name: v.string(),
    type: boatType,
    lengthFeet: v.number(),
    capacityGuests: v.number(),
    yearBuilt: v.optional(v.number()),
    manufacturer: v.optional(v.string()),
    model: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    amenities: v.array(v.string()),
    safetyEquipment: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireHost(ctx);

    return ctx.db.insert("boats", {
      hostId: user._id,
      name: args.name,
      type: args.type,
      lengthFeet: args.lengthFeet,
      capacityGuests: args.capacityGuests,
      yearBuilt: args.yearBuilt,
      manufacturer: args.manufacturer,
      model: args.model,
      registrationNumber: args.registrationNumber,
      description: args.description,
      amenities: args.amenities,
      safetyEquipment: args.safetyEquipment,
      photos: [],
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("boats"),
    name: v.optional(v.string()),
    type: v.optional(boatType),
    lengthFeet: v.optional(v.number()),
    capacityGuests: v.optional(v.number()),
    yearBuilt: v.optional(v.number()),
    manufacturer: v.optional(v.string()),
    model: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    amenities: v.optional(v.array(v.string())),
    safetyEquipment: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireHost(ctx);
    const boat = await ctx.db.get(args.id);
    if (!boat) throw new Error("Boat not found");
    if (boat.hostId !== user._id) throw new Error("Not your boat");

    const { id, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const getById = query({
  args: { id: v.id("boats") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getByHost = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireHost(ctx);
    return ctx.db
      .query("boats")
      .withIndex("by_hostId", (q) => q.eq("hostId", user._id))
      .collect();
  },
});

export const deactivate = mutation({
  args: { id: v.id("boats") },
  handler: async (ctx, args) => {
    const user = await requireHost(ctx);
    const boat = await ctx.db.get(args.id);
    if (!boat) throw new Error("Boat not found");
    if (boat.hostId !== user._id) throw new Error("Not your boat");

    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});
