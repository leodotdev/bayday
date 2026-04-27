import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Stripe webhook. Subscribe in dashboard to:
//   - checkout.session.completed       (paid via Checkout)
//   - payment_intent.succeeded         (paid via Elements / direct PI)
// Endpoint: https://<deployment>.convex.site/stripe/webhook
//
// The signing secret (whsec_…) goes in Convex env as STRIPE_WEBHOOK_SECRET.
// When the secret isn't set we accept the payload unverified to make local
// testing easier, but the deploy log loudly warns about it.
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.text();
    const signatureHeader = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secret) {
      const ok = await verifyStripeSignature(payload, signatureHeader, secret);
      if (!ok) {
        return new Response("Bad signature", { status: 400 });
      }
    } else {
      console.warn(
        "⚠️ Stripe webhook hit without STRIPE_WEBHOOK_SECRET — skipping " +
          "signature check. Set the env var before going live.",
      );
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(payload);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "payment_intent.succeeded"
    ) {
      const obj = event.data.object;
      const bookingId =
        typeof obj.client_reference_id === "string"
          ? obj.client_reference_id
          : typeof (obj.metadata as Record<string, string> | undefined)
                ?.bookingId === "string"
            ? (obj.metadata as Record<string, string>).bookingId
            : null;
      const paymentIntentId =
        typeof obj.payment_intent === "string"
          ? obj.payment_intent
          : typeof obj.id === "string" && event.type === "payment_intent.succeeded"
            ? obj.id
            : "unknown";
      if (bookingId) {
        await ctx.runMutation(internal.stripe.handlePaymentSucceeded, {
          bookingId: bookingId as Id<"bookings">,
          paymentIntentId,
        });
      }
    }

    return new Response("ok", { status: 200 });
  }),
});

// Stripe signs webhooks as `t=<unix>,v1=<hex>` where v1 is the HMAC-SHA256 of
// `<unix>.<rawBody>` with the whsec. We verify constant-time to avoid timing
// leaks, but the values themselves are short enough that it doesn't matter
// much in practice.
async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, ...rest] = kv.trim().split("=");
      return [k ?? "", rest.join("=")] as const;
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${timestamp}.${payload}`),
  );
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (hex.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hex.length; i++) {
    mismatch |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export default http;
