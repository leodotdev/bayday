import { v } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import { requireAuth, requireHost, optionalAuth } from "./helpers";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

async function notifyHostOfRequest(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
) {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return;
  const host = await ctx.db.get(booking.hostId);
  const listing = await ctx.db.get(booking.listingId);
  if (!host?.email || !listing) return;
  const wantsEmail = host.notificationPreferences?.emailBookings !== false;
  if (wantsEmail) {
    await ctx.scheduler.runAfter(0, internal.email.notifyBookingRequested, {
      to: host.email,
      hostName: host.firstName ?? host.name ?? "Captain",
      guestName: booking.guestName ?? "A guest",
      listingTitle: listing.title,
      date: booking.date,
      startTime: booking.startTime,
      partySize: booking.partySize,
    });
  }
}

async function notifyGuestOfConfirmation(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
) {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return;
  const listing = await ctx.db.get(booking.listingId);
  if (!listing) return;
  const guestEmail = booking.guestEmail;
  const guestName = booking.guestName ?? "Angler";
  const guestUser = booking.guestId ? await ctx.db.get(booking.guestId) : null;
  const wantsEmail =
    guestUser?.notificationPreferences?.emailBookings !== false;
  if (guestEmail && wantsEmail) {
    await ctx.scheduler.runAfter(0, internal.email.notifyBookingConfirmed, {
      to: guestEmail,
      guestName,
      listingTitle: listing.title,
      date: booking.date,
      startTime: booking.startTime,
      departurePort: listing.departurePort,
      bookingId: bookingId,
    });
  }
  const guestPhone = booking.guestPhone ?? guestUser?.phone;
  const wantsSms = guestUser?.notificationPreferences?.smsBookings === true;
  if (guestPhone && wantsSms) {
    await ctx.scheduler.runAfter(0, internal.sms.notifyBookingConfirmed, {
      to: guestPhone,
      listingTitle: listing.title,
      date: booking.date,
      startTime: booking.startTime,
    });
  }
}

const PLATFORM_FEE_PERCENT = 10;

function getDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

async function reopenAvailabilitySlots(
  ctx: MutationCtx,
  listingId: Id<"listings">,
  date: string,
  endDate?: string
) {
  const dates = endDate ? getDatesBetween(date, endDate) : [date];
  for (const d of dates) {
    const slot = await ctx.db
      .query("availability")
      .withIndex("by_listingId_date", (q) =>
        q.eq("listingId", listingId).eq("date", d)
      )
      .first();
    if (slot) {
      await ctx.db.patch(slot._id, { isAvailable: true });
    }
  }
}

async function validateAndCalculateBooking(
  ctx: MutationCtx,
  args: {
    listingId: Id<"listings">;
    date: string;
    endDate?: string;
    partySize: number;
  }
) {
  const listing = await ctx.db.get(args.listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "published") throw new Error("Listing is not available");

  if (args.partySize > listing.maxGuests) {
    throw new Error(`Party size exceeds maximum of ${listing.maxGuests} guests`);
  }
  if (listing.minGuests && args.partySize < listing.minGuests) {
    throw new Error(`Party size is below minimum of ${listing.minGuests} guests`);
  }

  // Validate all dates in range
  const bookingDates = args.endDate
    ? getDatesBetween(args.date, args.endDate)
    : [args.date];

  const slots = [];
  for (const d of bookingDates) {
    const slot = await ctx.db
      .query("availability")
      .withIndex("by_listingId_date", (q) =>
        q.eq("listingId", args.listingId).eq("date", d)
      )
      .first();

    if (slot && !slot.isAvailable) {
      throw new Error(`Date ${d} is not available`);
    }
    slots.push(slot);
  }

  // Price: sum across all days
  const numDays = bookingDates.length;
  let totalPriceCents = 0;

  for (const slot of slots) {
    const dayPrice = slot?.customPriceCents ?? listing.priceCents;
    if (listing.priceType === "per_person") {
      totalPriceCents += dayPrice * args.partySize;
    } else {
      totalPriceCents += dayPrice;
    }
  }

  const platformFeeCents = Math.round(totalPriceCents * (PLATFORM_FEE_PERCENT / 100));
  const hostPayoutCents = totalPriceCents - platformFeeCents;
  const status: "confirmed" | "pending" = listing.instantBook ? "confirmed" : "pending";

  return { listing, slots, numDays, totalPriceCents, platformFeeCents, hostPayoutCents, status };
}

export const create = mutation({
  args: {
    listingId: v.id("listings"),
    date: v.string(),
    endDate: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    partySize: v.number(),
    costSharingEnabled: v.boolean(),
    costSharingMaxSpots: v.optional(v.number()),
    costSharingDeadline: v.optional(v.number()),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("public"))
    ),
    specialRequests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const guest = await requireAuth(ctx);
    const { listing, slots, totalPriceCents, platformFeeCents, hostPayoutCents, status } =
      await validateAndCalculateBooking(ctx, args);

    if (args.costSharingEnabled && !listing.allowCostSharing) {
      throw new Error("This captain has not enabled shared trips for this listing");
    }

    const now = Date.now();

    const bookingId = await ctx.db.insert("bookings", {
      listingId: args.listingId,
      boatId: listing.boatId,
      hostId: listing.hostId,
      guestId: guest._id,
      guestEmail: guest.email,
      guestName: guest.firstName
        ? `${guest.firstName}${guest.lastName ? ` ${guest.lastName}` : ""}`
        : undefined,
      guestPhone: guest.phone,
      date: args.date,
      endDate: args.endDate,
      startTime: args.startTime,
      endTime: args.endTime,
      partySize: args.partySize,
      totalPriceCents,
      status,
      costSharingEnabled: args.costSharingEnabled,
      costSharingMaxSpots: args.costSharingEnabled
        ? args.costSharingMaxSpots ?? listing.maxGuests
        : undefined,
      costSharingDeadline: args.costSharingDeadline,
      visibility: args.costSharingEnabled
        ? args.visibility ?? "private"
        : undefined,
      specialRequests: args.specialRequests,
      hostPayoutCents,
      platformFeeCents,
      createdAt: now,
      updatedAt: now,
    });

    for (const slot of slots) {
      if (slot) await ctx.db.patch(slot._id, { isAvailable: false });
    }

    await notifyHostOfRequest(ctx, bookingId);
    if (status === "confirmed") {
      await notifyGuestOfConfirmation(ctx, bookingId);
    }

    return bookingId;
  },
});

export const createAsGuest = mutation({
  args: {
    listingId: v.id("listings"),
    date: v.string(),
    endDate: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    partySize: v.number(),
    specialRequests: v.optional(v.string()),
    guestName: v.string(),
    guestEmail: v.string(),
    guestPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await optionalAuth(ctx);
    const { listing, slots, totalPriceCents, platformFeeCents, hostPayoutCents, status } =
      await validateAndCalculateBooking(ctx, args);

    const accessToken = crypto.randomUUID();
    const now = Date.now();

    const bookingId = await ctx.db.insert("bookings", {
      listingId: args.listingId,
      boatId: listing.boatId,
      hostId: listing.hostId,
      guestId: user?._id,
      guestEmail: args.guestEmail,
      guestName: args.guestName,
      guestPhone: args.guestPhone,
      accessToken,
      date: args.date,
      endDate: args.endDate,
      startTime: args.startTime,
      endTime: args.endTime,
      partySize: args.partySize,
      totalPriceCents,
      status,
      costSharingEnabled: false,
      specialRequests: args.specialRequests,
      hostPayoutCents,
      platformFeeCents,
      createdAt: now,
      updatedAt: now,
    });

    for (const slot of slots) {
      if (slot) await ctx.db.patch(slot._id, { isAvailable: false });
    }

    await notifyHostOfRequest(ctx, bookingId);
    if (status === "confirmed") {
      await notifyGuestOfConfirmation(ctx, bookingId);
    }

    return { bookingId, accessToken };
  },
});

export const confirm = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.hostId !== host._id) throw new Error("Not your booking to confirm");
    if (booking.status !== "pending") throw new Error("Booking is not pending");

    await ctx.db.patch(args.id, {
      status: "confirmed",
      updatedAt: Date.now(),
    });

    await notifyGuestOfConfirmation(ctx, args.id);

    return args.id;
  },
});

export const cancelByGuest = mutation({
  args: {
    id: v.id("bookings"),
    reason: v.optional(v.string()),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");

    // Verify ownership: either by auth or by access token
    if (args.accessToken) {
      if (booking.accessToken !== args.accessToken) throw new Error("Invalid access token");
    } else {
      const guest = await requireAuth(ctx);
      if (booking.guestId !== guest._id) throw new Error("Not your booking");
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new Error("Booking cannot be cancelled");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled_by_guest",
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });

    await reopenAvailabilitySlots(ctx, booking.listingId, booking.date, booking.endDate);

    return args.id;
  },
});

export const cancelByHost = mutation({
  args: {
    id: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.hostId !== host._id) throw new Error("Not your booking");
    if (
      booking.status !== "pending" &&
      booking.status !== "confirmed"
    ) {
      throw new Error("Booking cannot be cancelled");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled_by_host",
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });

    await reopenAvailabilitySlots(ctx, booking.listingId, booking.date, booking.endDate);

    return args.id;
  },
});

export const complete = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.hostId !== host._id) throw new Error("Not your booking");
    if (booking.status !== "confirmed") {
      throw new Error("Only confirmed bookings can be completed");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const getById = query({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) return null;

    const listing = await ctx.db.get(booking.listingId);
    const boat = await ctx.db.get(booking.boatId);
    const host = await ctx.db.get(booking.hostId);
    const guest = booking.guestId ? await ctx.db.get(booking.guestId) : null;

    return { ...booking, listing, boat, host, guest };
  },
});

export const getByAccessToken = query({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_accessToken", (q) => q.eq("accessToken", args.accessToken))
      .unique();

    if (!booking) return null;

    const listing = await ctx.db.get(booking.listingId);
    const boat = await ctx.db.get(booking.boatId);
    const host = await ctx.db.get(booking.hostId);

    // Don't expose internal financial fields
    const { hostPayoutCents, platformFeeCents, ...safeBooking } = booking;

    return { ...safeBooking, listing, boat, host };
  },
});

export const getByGuest = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled_by_guest"),
        v.literal("cancelled_by_host"),
        v.literal("completed"),
        v.literal("no_show"),
        v.literal("disputed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const guest = await optionalAuth(ctx);
    if (!guest) return [];

    let bookings;
    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_guestId_status", (q) =>
          q.eq("guestId", guest._id).eq("status", args.status!)
        )
        .collect();
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_guestId", (q) => q.eq("guestId", guest._id))
        .collect();
    }

    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const listing = await ctx.db.get(booking.listingId);
        const boat = await ctx.db.get(booking.boatId);
        return { ...booking, listing, boat };
      })
    );

    return enriched;
  },
});

export const getByHost = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled_by_guest"),
        v.literal("cancelled_by_host"),
        v.literal("completed"),
        v.literal("no_show"),
        v.literal("disputed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const host = await requireHost(ctx);

    let bookings;
    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_hostId_status", (q) =>
          q.eq("hostId", host._id).eq("status", args.status!)
        )
        .collect();
    } else {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_hostId", (q) => q.eq("hostId", host._id))
        .collect();
    }

    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const listing = await ctx.db.get(booking.listingId);
        const guest = booking.guestId ? await ctx.db.get(booking.guestId) : null;
        const boat = await ctx.db.get(booking.boatId);
        return {
          ...booking,
          listing,
          guest: guest ?? {
            firstName: booking.guestName,
            email: booking.guestEmail,
            phone: booking.guestPhone,
          },
          boat,
        };
      })
    );

    return enriched;
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const today = new Date().toISOString().split("T")[0];

    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_guestId_status", (q) =>
        q.eq("guestId", user._id).eq("status", "confirmed")
      )
      .collect();

    const upcoming = allBookings.filter((b) => b.date >= today);

    const enriched = await Promise.all(
      upcoming.map(async (booking) => {
        const listing = await ctx.db.get(booking.listingId);
        const boat = await ctx.db.get(booking.boatId);
        const host = await ctx.db.get(booking.hostId);
        return { ...booking, listing, boat, host };
      })
    );

    return enriched.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getHostStats = query({
  args: {},
  handler: async (ctx) => {
    const host = await requireHost(ctx);

    const allListings = await ctx.db
      .query("listings")
      .withIndex("by_hostId", (q) => q.eq("hostId", host._id))
      .collect();
    const activeListings = allListings.filter(
      (l) => l.status === "published"
    ).length;

    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_hostId", (q) => q.eq("hostId", host._id))
      .collect();

    const today = new Date().toISOString().split("T")[0];

    const upcomingBookings = allBookings.filter(
      (b) => b.date >= today && (b.status === "confirmed" || b.status === "pending")
    ).length;

    const pendingRequests = allBookings.filter(
      (b) => b.status === "pending"
    ).length;

    const completedBookings = allBookings.filter(
      (b) => b.status === "completed"
    ).length;

    const totalBookings = allBookings.length;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const completedAll = allBookings.filter((b) => b.status === "completed");

    const totalEarnings = completedAll.reduce(
      (sum, b) => sum + (b.hostPayoutCents ?? 0),
      0
    );

    const thisMonthCompleted = completedAll.filter(
      (b) => b.date >= thisMonthStart && b.date <= thisMonthEnd
    );
    const thisMonthEarnings = thisMonthCompleted.reduce(
      (sum, b) => sum + (b.hostPayoutCents ?? 0),
      0
    );

    const recentBookings = allBookings
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const enrichedRecent = await Promise.all(
      recentBookings.map(async (booking) => {
        const listing = await ctx.db.get(booking.listingId);
        const guest = booking.guestId ? await ctx.db.get(booking.guestId) : null;
        return {
          ...booking,
          listing,
          guest: guest ?? {
            firstName: booking.guestName,
            email: booking.guestEmail,
          },
        };
      })
    );

    return {
      activeListings,
      upcomingBookings,
      pendingRequests,
      thisMonthEarnings,
      totalEarnings,
      totalBookings,
      completedBookings,
      recentBookings: enrichedRecent,
    };
  },
});
