import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { optionalAuth } from "./helpers";

export const invite = mutation({
  args: {
    bookingId: v.id("bookings"),
    email: v.string(),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    // Verify caller owns the booking (by auth or access token)
    const user = await optionalAuth(ctx);
    if (args.accessToken) {
      if (booking.accessToken !== args.accessToken) throw new Error("Unauthorized");
    } else if (user) {
      if (booking.guestId !== user._id) throw new Error("Not your booking");
    } else {
      throw new Error("Unauthorized");
    }

    // Check if already invited
    const existing = await ctx.db
      .query("bookingParticipants")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    if (existing.some((p) => p.email === args.email && p.status !== "cancelled")) {
      throw new Error("This person has already been invited");
    }

    // Check we haven't exceeded party size
    const activeParticipants = existing.filter(
      (p) => p.status === "confirmed" || p.status === "pending"
    );
    if (activeParticipants.length >= booking.partySize) {
      throw new Error("Party is full");
    }

    const inviteCode = crypto.randomUUID();

    const id = await ctx.db.insert("bookingParticipants", {
      bookingId: args.bookingId,
      email: args.email,
      inviteCode,
      role: "invited",
      status: "pending",
      shareCents: 0,
      hasPaid: false,
      joinedAt: Date.now(),
    });

    return { id, inviteCode };
  },
});

export const remove = mutation({
  args: {
    participantId: v.id("bookingParticipants"),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found");

    const booking = await ctx.db.get(participant.bookingId);
    if (!booking) throw new Error("Booking not found");

    const user = await optionalAuth(ctx);
    if (args.accessToken) {
      if (booking.accessToken !== args.accessToken) throw new Error("Unauthorized");
    } else if (user) {
      if (booking.guestId !== user._id) throw new Error("Not your booking");
    } else {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.participantId, { status: "cancelled" });
  },
});

export const getByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("bookingParticipants")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    return participants.filter((p) => p.status !== "cancelled");
  },
});

export const respondToInvite = mutation({
  args: {
    inviteCode: v.string(),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("bookingParticipants")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!participant) throw new Error("Invite not found");
    if (participant.status !== "pending") throw new Error("Invite already responded to");

    const user = await optionalAuth(ctx);

    await ctx.db.patch(participant._id, {
      status: args.accept ? "confirmed" : "declined",
      userId: user?._id ?? undefined,
    });

    return participant.bookingId;
  },
});
