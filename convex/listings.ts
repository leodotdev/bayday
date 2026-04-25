import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireHost, optionalAuth } from "./helpers";

export const getPublished = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing || listing.status !== "published") return null;

    const boat = await ctx.db.get(listing.boatId);
    const host = await ctx.db.get(listing.hostId);

    return { ...listing, boat, host };
  },
});

export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    tripType: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.searchTerm) {
      const searchQuery = ctx.db
        .query("listings")
        .withSearchIndex("search_title", (q) => {
          let search = q.search("title", args.searchTerm!);
          search = search.eq("status", "published");
          if (args.tripType) search = search.eq("tripType", args.tripType as any);
          if (args.city) search = search.eq("departureCity", args.city);
          return search;
        });
      return searchQuery.collect();
    }

    const query = ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "published"));

    const results = await query.collect();

    return results.filter((listing) => {
      if (args.tripType && listing.tripType !== args.tripType) return false;
      if (args.city && listing.departureCity !== args.city) return false;
      return true;
    });
  },
});

const tripTypeValidator = v.union(
  v.literal("inshore"),
  v.literal("offshore"),
  v.literal("deep_sea"),
  v.literal("fly_fishing"),
  v.literal("trolling"),
  v.literal("bottom_fishing"),
  v.literal("spearfishing"),
  v.literal("sunset_cruise"),
  v.literal("custom")
);

const priceTypeValidator = v.union(
  v.literal("per_person"),
  v.literal("per_trip")
);

const cancellationPolicyValidator = v.union(
  v.literal("flexible"),
  v.literal("moderate"),
  v.literal("strict")
);

export const create = mutation({
  args: {
    boatId: v.id("boats"),
    title: v.string(),
    description: v.string(),
    tripType: tripTypeValidator,
    durationHours: v.number(),
    priceCents: v.number(),
    priceType: priceTypeValidator,
    maxGuests: v.number(),
    minGuests: v.optional(v.number()),
    captainIncluded: v.boolean(),
    captainName: v.optional(v.string()),
    captainBio: v.optional(v.string()),
    targetSpecies: v.array(v.string()),
    departurePort: v.string(),
    departureLatitude: v.number(),
    departureLongitude: v.number(),
    departureCity: v.string(),
    departureState: v.string(),
    includesEquipment: v.boolean(),
    includesBait: v.boolean(),
    includesLunch: v.boolean(),
    customInclusions: v.array(v.string()),
    cancellationPolicy: cancellationPolicyValidator,
    instantBook: v.boolean(),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const boat = await ctx.db.get(args.boatId);
    if (!boat) throw new Error("Boat not found");
    if (boat.hostId !== host._id) throw new Error("Boat does not belong to you");

    const now = Date.now();

    return ctx.db.insert("listings", {
      hostId: host._id,
      boatId: args.boatId,
      title: args.title,
      description: args.description,
      tripType: args.tripType,
      durationHours: args.durationHours,
      priceCents: args.priceCents,
      priceType: args.priceType,
      maxGuests: args.maxGuests,
      minGuests: args.minGuests,
      captainIncluded: args.captainIncluded,
      captainName: args.captainName,
      captainBio: args.captainBio,
      targetSpecies: args.targetSpecies,
      departurePort: args.departurePort,
      departureLatitude: args.departureLatitude,
      departureLongitude: args.departureLongitude,
      departureCity: args.departureCity,
      departureState: args.departureState,
      includesEquipment: args.includesEquipment,
      includesBait: args.includesBait,
      includesLunch: args.includesLunch,
      customInclusions: args.customInclusions,
      cancellationPolicy: args.cancellationPolicy,
      instantBook: args.instantBook,
      status: "draft",
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("listings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tripType: v.optional(tripTypeValidator),
    durationHours: v.optional(v.number()),
    priceCents: v.optional(v.number()),
    priceType: v.optional(priceTypeValidator),
    maxGuests: v.optional(v.number()),
    minGuests: v.optional(v.number()),
    captainIncluded: v.optional(v.boolean()),
    captainName: v.optional(v.string()),
    captainBio: v.optional(v.string()),
    targetSpecies: v.optional(v.array(v.string())),
    departurePort: v.optional(v.string()),
    departureLatitude: v.optional(v.number()),
    departureLongitude: v.optional(v.number()),
    departureCity: v.optional(v.string()),
    departureState: v.optional(v.string()),
    includesEquipment: v.optional(v.boolean()),
    includesBait: v.optional(v.boolean()),
    includesLunch: v.optional(v.boolean()),
    customInclusions: v.optional(v.array(v.string())),
    cancellationPolicy: v.optional(cancellationPolicyValidator),
    instantBook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const listing = await ctx.db.get(args.id);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id) throw new Error("Listing does not belong to you");

    const { id, ...updates } = args;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const publish = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const listing = await ctx.db.get(args.id);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id) throw new Error("Listing does not belong to you");
    if (listing.status !== "draft" && listing.status !== "paused") {
      throw new Error("Only draft or paused listings can be published");
    }

    await ctx.db.patch(args.id, {
      status: "published",
      updatedAt: Date.now(),
    });
  },
});

export const pause = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const listing = await ctx.db.get(args.id);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id) throw new Error("Listing does not belong to you");
    if (listing.status !== "published") {
      throw new Error("Only published listings can be paused");
    }

    await ctx.db.patch(args.id, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const listing = await ctx.db.get(args.id);
    if (!listing) throw new Error("Listing not found");
    if (listing.hostId !== host._id) throw new Error("Listing does not belong to you");

    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

export const getByHost = query({
  args: {},
  handler: async (ctx) => {
    const host = await requireHost(ctx);

    return ctx.db
      .query("listings")
      .withIndex("by_hostId", (q) => q.eq("hostId", host._id))
      .collect();
  },
});

export const getByIdFull = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) return null;

    const currentUser = await optionalAuth(ctx);
    const isOwner = currentUser && currentUser._id === listing.hostId;
    const isAdmin = currentUser && currentUser.role === "admin";

    if (listing.status !== "published" && !isOwner && !isAdmin) {
      return null;
    }

    const boat = await ctx.db.get(listing.boatId);
    const host = await ctx.db.get(listing.hostId);

    return { ...listing, boat, host };
  },
});
