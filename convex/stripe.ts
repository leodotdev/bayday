import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// --- Config ---
//
// Set in Convex env via `npx convex env set ...`:
//   STRIPE_SECRET_KEY        sk_test_xxx or sk_live_xxx
//   STRIPE_WEBHOOK_SECRET    whsec_xxx (later, when wiring webhooks)
//   DAYTRIP_PUBLIC_URL       e.g. https://daytrip.app — used for
//                            success_url / cancel_url; defaults to
//                            http://localhost:3000 if missing.
//
// When STRIPE_SECRET_KEY is missing the action returns a "dev-mode"
// session marker that the client treats as immediate-confirm (matches
// pre-Stripe behavior so the booking flow keeps working in dev).

function getReturnBase() {
  return process.env.DAYTRIP_PUBLIC_URL ?? "http://localhost:3000";
}

export const createCheckoutSession = action({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const booking = await ctx.runQuery(internal.stripe.getBookingForCheckout, {
      bookingId: args.bookingId,
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.guestId !== userId) {
      throw new Error("Not your booking to pay for");
    }
    const userEmail = (await ctx.auth.getUserIdentity())?.email;
    if (booking.status === "completed" || booking.status.startsWith("cancelled")) {
      throw new Error(`Booking is ${booking.status}, can't pay`);
    }

    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      console.log(
        `💳 [stripe dev mode] would create checkout for ${args.bookingId} ` +
          `total ${booking.totalPriceCents} cents ` +
          `(set STRIPE_SECRET_KEY in Convex env to enable real checkout)`,
      );
      return {
        mode: "dev" as const,
        url: null,
      };
    }

    const base = getReturnBase();
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("payment_method_types[]", "card");
    params.set(
      "success_url",
      `${base}/booking/confirmation/${args.bookingId}?paid=1`,
    );
    params.set(
      "cancel_url",
      `${base}/booking/${booking.listingId}?cancelled=1`,
    );
    params.set("client_reference_id", args.bookingId);
    params.set("metadata[bookingId]", args.bookingId);
    params.set("metadata[hostId]", booking.hostId);
    if (userEmail) params.set("customer_email", userEmail);

    const lineItem = {
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(booking.totalPriceCents),
      "line_items[0][price_data][product_data][name]":
        booking.listingTitle ?? "DayTrip charter",
      "line_items[0][price_data][product_data][description]": `${booking.date} · ${booking.partySize} ${booking.partySize === 1 ? "angler" : "anglers"}`,
    } as const;
    for (const [k, v] of Object.entries(lineItem)) {
      params.set(k, v);
    }
    if (booking.platformFeeCents !== undefined) {
      params.set(
        "payment_intent_data[application_fee_amount]",
        String(booking.platformFeeCents),
      );
    }

    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Stripe error: ${resp.status} ${text}`);
    }
    const data = (await resp.json()) as { id: string; url: string };
    await ctx.runMutation(internal.stripe.recordCheckoutSession, {
      bookingId: args.bookingId,
      sessionId: data.id,
    });
    return { mode: "live" as const, url: data.url };
  },
});

export const getBookingForCheckout = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const listing = await ctx.db.get(booking.listingId);
    return {
      _id: booking._id,
      hostId: booking.hostId,
      listingId: booking.listingId,
      listingTitle: listing?.title ?? "DayTrip charter",
      guestId: booking.guestId,
      status: booking.status,
      totalPriceCents: booking.totalPriceCents,
      platformFeeCents: booking.platformFeeCents,
      date: booking.date,
      partySize: booking.partySize,
    };
  },
});

export const recordCheckoutSession = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      stripeSessionId: args.sessionId,
      updatedAt: Date.now(),
    });
  },
});

// Called from the Stripe webhook when payment_intent.succeeded fires.
// The webhook itself lives in convex/http.ts (added separately).
export const handlePaymentSucceeded = internalMutation({
  args: { bookingId: v.id("bookings"), paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;
    if (booking.status !== "pending" && booking.status !== "confirmed") return;
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      stripePaymentIntentId: args.paymentIntentId,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
    // Drop a notification on the guest
    if (booking.guestId) {
      await ctx.db.insert("notifications", {
        userId: booking.guestId as Id<"users">,
        type: "booking_confirmed",
        title: "Payment received",
        body: `Your trip on ${booking.date} is paid and confirmed.`,
        referenceType: "booking",
        referenceId: args.bookingId,
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});
