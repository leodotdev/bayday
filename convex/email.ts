import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";

// FROM address — env-driven so you can flip to onboarding@resend.dev
// for sandbox testing before daytrip.app is verified in Resend.
function getFromAddress() {
  const fromEmail = process.env.DAYTRIP_EMAIL_FROM ?? "noreply@daytrip.app";
  const fromName = process.env.DAYTRIP_EMAIL_FROM_NAME ?? "DayTrip";
  return `${fromName} <${fromEmail}>`;
}
const BRAND = "DayTrip";

async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `📧 [email dev mode] would send to ${to}: ${subject} ` +
        `(set RESEND_API_KEY in Convex env to send for real)`,
    );
    return { success: true, id: "dev-mode" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from ?? getFromAddress(),
      to: [to],
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Resend error:", err);
    return { success: false, error: err };
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #0f172a;
  line-height: 1.5;
`;

function wrap(content: string) {
  return `<div style="${baseStyles}">${content}<hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" /><p style="font-size: 12px; color: #64748b;">${BRAND} · You're receiving this because of activity on your account.</p></div>`;
}

// --- Feedback ---
export const sendFeedback = action({
  args: {
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: "leo@leo.dev",
      subject: `[Feedback] ${args.subject}`,
      replyTo: args.email,
      html: wrap(`
        <h2>Feedback from ${args.name}</h2>
        <p><strong>From:</strong> ${args.email}</p>
        <p><strong>Subject:</strong> ${args.subject}</p>
        <p>${args.message.replace(/\n/g, "<br />")}</p>
      `),
    });
  },
});

// --- Welcome ---
export const notifyWelcome = internalAction({
  args: { to: v.string(), firstName: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const name = args.firstName ?? "there";
    return sendEmail({
      to: args.to,
      subject: `Welcome to ${BRAND}`,
      html: wrap(`
        <h2>Welcome aboard, ${name}!</h2>
        <p>Your ${BRAND} account is ready. Browse charters, book trips, and join shared trips with friends or new anglers.</p>
        <p><a href="https://daytrip.app/search" style="background: #0f172a; color: white; text-decoration: none; padding: 10px 16px; border-radius: 999px; display: inline-block;">Find a boat</a></p>
      `),
    });
  },
});

// --- New message ---
export const notifyNewMessage = internalAction({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    senderName: v.string(),
    messagePreview: v.string(),
    conversationId: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: args.recipientEmail,
      subject: `New message from ${args.senderName}`,
      html: wrap(`
        <h2>${args.senderName} sent you a message</h2>
        <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 3px solid #0f172a; color: #475569;">${args.messagePreview}</blockquote>
        <p><a href="https://daytrip.app/conversation/${args.conversationId}">Open the conversation →</a></p>
      `),
    });
  },
});

// --- Booking requested (sent to host) ---
export const notifyBookingRequested = internalAction({
  args: {
    to: v.string(),
    hostName: v.string(),
    guestName: v.string(),
    listingTitle: v.string(),
    date: v.string(),
    startTime: v.string(),
    partySize: v.number(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: args.to,
      subject: `New booking request — ${args.listingTitle}`,
      html: wrap(`
        <h2>New booking request</h2>
        <p>Hi ${args.hostName},</p>
        <p><strong>${args.guestName}</strong> wants to book <strong>${args.listingTitle}</strong>.</p>
        <table style="margin: 16px 0;">
          <tr><td style="color: #64748b; padding-right: 12px;">Date</td><td><strong>${args.date}</strong></td></tr>
          <tr><td style="color: #64748b; padding-right: 12px;">Time</td><td><strong>${args.startTime}</strong></td></tr>
          <tr><td style="color: #64748b; padding-right: 12px;">Party</td><td><strong>${args.partySize} ${args.partySize === 1 ? "angler" : "anglers"}</strong></td></tr>
        </table>
        <p><a href="https://daytrip.app/captain/bookings">Review the request →</a></p>
      `),
    });
  },
});

// --- Booking confirmed (sent to guest) ---
export const notifyBookingConfirmed = internalAction({
  args: {
    to: v.string(),
    guestName: v.string(),
    listingTitle: v.string(),
    date: v.string(),
    startTime: v.string(),
    departurePort: v.string(),
    bookingId: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: args.to,
      subject: `Booking confirmed: ${args.listingTitle}`,
      html: wrap(`
        <h2>Your trip is confirmed!</h2>
        <p>Hi ${args.guestName},</p>
        <p>Your booking for <strong>${args.listingTitle}</strong> is locked in.</p>
        <table style="margin: 16px 0;">
          <tr><td style="color: #64748b; padding-right: 12px;">Date</td><td><strong>${args.date}</strong></td></tr>
          <tr><td style="color: #64748b; padding-right: 12px;">Time</td><td><strong>${args.startTime}</strong></td></tr>
          <tr><td style="color: #64748b; padding-right: 12px;">Meet at</td><td><strong>${args.departurePort}</strong></td></tr>
        </table>
        <p>Arrive 15–20 minutes early.</p>
        <p><a href="https://daytrip.app/trips/${args.bookingId}">View your trip →</a></p>
      `),
    });
  },
});

// --- Shared-trip invite ---
export const notifyShareInvite = internalAction({
  args: {
    to: v.string(),
    organizerName: v.string(),
    listingTitle: v.string(),
    date: v.string(),
    pricePerSpot: v.string(),
    inviteUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: args.to,
      subject: `${args.organizerName} invited you on a fishing trip`,
      html: wrap(`
        <h2>You're invited!</h2>
        <p>${args.organizerName} wants you to join <strong>${args.listingTitle}</strong> on ${args.date} for <strong>${args.pricePerSpot}</strong> per spot.</p>
        <p><a href="${args.inviteUrl}" style="background: #0f172a; color: white; text-decoration: none; padding: 10px 16px; border-radius: 999px; display: inline-block;">View invite →</a></p>
      `),
    });
  },
});

// --- Generic helper ---
export const sendNotificationEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: args.to,
      subject: args.subject,
      html: wrap(args.html),
    });
  },
});
