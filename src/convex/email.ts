import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";

// Resend API helper — works with Convex actions (which can do HTTP calls)
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
    console.warn("RESEND_API_KEY not set — email not sent:", subject);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from ?? "Angler's Day <noreply@anglersday.com>",
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

// --- Feedback email ---
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
      html: `
        <h2>Feedback from ${args.name}</h2>
        <p><strong>From:</strong> ${args.email}</p>
        <p><strong>Subject:</strong> ${args.subject}</p>
        <hr />
        <p>${args.message.replace(/\n/g, "<br />")}</p>
      `,
    });
  },
});

// --- Notification email (internal, called from other mutations) ---
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
      html: args.html,
    });
  },
});

// --- New message notification ---
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
      html: `
        <h2>New message from ${args.senderName}</h2>
        <p style="color: #666; font-size: 14px;">${args.messagePreview}</p>
        <hr />
        <p>Open the Angler's Day app to reply.</p>
      `,
    });
  },
});

// --- Booking confirmation email ---
export const notifyBookingConfirmed = internalAction({
  args: {
    to: v.string(),
    guestName: v.string(),
    listingTitle: v.string(),
    date: v.string(),
    startTime: v.string(),
    departurePort: v.string(),
  },
  handler: async (_ctx, args) => {
    return sendEmail({
      to: args.to,
      subject: `Booking Confirmed: ${args.listingTitle}`,
      html: `
        <h2>Your trip is confirmed!</h2>
        <p>Hi ${args.guestName},</p>
        <p>Your booking for <strong>${args.listingTitle}</strong> is confirmed.</p>
        <table style="margin: 16px 0;">
          <tr><td style="color: #666; padding-right: 12px;">Date</td><td><strong>${args.date}</strong></td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Time</td><td><strong>${args.startTime}</strong></td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Meet at</td><td><strong>${args.departurePort}</strong></td></tr>
        </table>
        <p>Open the app for full details or to message your captain.</p>
      `,
    });
  },
});
