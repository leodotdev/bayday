import { v } from "convex/values";
import { internalAction } from "./_generated/server";

async function sendSms({ to, body }: { to: string; body: string }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !authToken || !from) {
    console.log(
      `📱 [sms dev mode] would send to ${to}: ${body} ` +
        `(set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER ` +
        `in Convex env to send for real)`,
    );
    return { success: true, id: "dev-mode" };
  }

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${sid}:${authToken}`)}`,
      },
      body: params.toString(),
    },
  );
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Twilio SMS error:", text);
    return { success: false, error: text };
  }
  const data = (await resp.json()) as { sid?: string };
  return { success: true, id: data.sid };
}

// --- Booking confirmed ---
export const notifyBookingConfirmed = internalAction({
  args: {
    to: v.string(),
    listingTitle: v.string(),
    date: v.string(),
    startTime: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendSms({
      to: args.to,
      body: `daytrip: ${args.listingTitle} on ${args.date} at ${args.startTime} is confirmed. View in app.`,
    });
  },
});

// --- New message ---
export const notifyNewMessage = internalAction({
  args: {
    to: v.string(),
    senderName: v.string(),
    preview: v.string(),
  },
  handler: async (_ctx, args) => {
    const trimmedPreview =
      args.preview.length > 80
        ? `${args.preview.slice(0, 77)}…`
        : args.preview;
    return sendSms({
      to: args.to,
      body: `daytrip: ${args.senderName}: ${trimmedPreview}`,
    });
  },
});

// --- Trip reminder (24h ahead) ---
export const notifyTripReminder = internalAction({
  args: {
    to: v.string(),
    listingTitle: v.string(),
    departurePort: v.string(),
    startTime: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendSms({
      to: args.to,
      body: `daytrip reminder: ${args.listingTitle} tomorrow at ${args.startTime}. Meet at ${args.departurePort}. Arrive 15 min early.`,
    });
  },
});
