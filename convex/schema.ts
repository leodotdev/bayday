import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("guest"),
        v.literal("host"),
        v.literal("admin")
      )
    ),
    bio: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    isBanned: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

  boats: defineTable({
    hostId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("center_console"),
      v.literal("sportfisher"),
      v.literal("pontoon"),
      v.literal("sailboat"),
      v.literal("catamaran"),
      v.literal("kayak"),
      v.literal("other")
    ),
    lengthFeet: v.number(),
    capacityGuests: v.number(),
    yearBuilt: v.optional(v.number()),
    manufacturer: v.optional(v.string()),
    model: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    photos: v.array(v.id("_storage")),
    amenities: v.array(v.string()),
    safetyEquipment: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_hostId", ["hostId"]),

  listings: defineTable({
    hostId: v.id("users"),
    boatId: v.id("boats"),
    title: v.string(),
    description: v.string(),
    tripType: v.union(
      v.literal("inshore"),
      v.literal("offshore"),
      v.literal("deep_sea"),
      v.literal("fly_fishing"),
      v.literal("trolling"),
      v.literal("bottom_fishing"),
      v.literal("spearfishing"),
      v.literal("sunset_cruise"),
      v.literal("custom")
    ),
    durationHours: v.number(),
    priceCents: v.number(),
    priceType: v.union(
      v.literal("per_person"),
      v.literal("per_trip")
    ),
    maxGuests: v.number(),
    minGuests: v.optional(v.number()),
    captainIncluded: v.boolean(),
    captainName: v.optional(v.string()),
    captainBio: v.optional(v.string()),
    captainPhoto: v.optional(v.id("_storage")),
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
    cancellationPolicy: v.union(
      v.literal("flexible"),
      v.literal("moderate"),
      v.literal("strict")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("paused"),
      v.literal("archived"),
      v.literal("rejected")
    ),
    adminNotes: v.optional(v.string()),
    averageRating: v.optional(v.number()),
    reviewCount: v.number(),
    instantBook: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_hostId", ["hostId"])
    .index("by_boatId", ["boatId"])
    .index("by_status", ["status"])
    .index("by_tripType", ["tripType"])
    .index("by_departureCity", ["departureCity"])
    .index("by_status_tripType", ["status", "tripType"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "tripType", "departureCity", "departureState"],
    }),

  availability: defineTable({
    listingId: v.id("listings"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    isAvailable: v.boolean(),
    customPriceCents: v.optional(v.number()),
  })
    .index("by_listingId", ["listingId"])
    .index("by_listingId_date", ["listingId", "date"])
    .index("by_date", ["date"]),

  bookings: defineTable({
    listingId: v.id("listings"),
    boatId: v.id("boats"),
    hostId: v.id("users"),
    guestId: v.optional(v.id("users")),
    guestEmail: v.optional(v.string()),
    guestPhone: v.optional(v.string()),
    guestName: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    date: v.string(),
    endDate: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    partySize: v.number(),
    totalPriceCents: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled_by_guest"),
      v.literal("cancelled_by_host"),
      v.literal("completed"),
      v.literal("no_show"),
      v.literal("disputed")
    ),
    costSharingEnabled: v.boolean(),
    costSharingMaxSpots: v.optional(v.number()),
    costSharingDeadline: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    hostPayoutCents: v.optional(v.number()),
    platformFeeCents: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_guestId", ["guestId"])
    .index("by_hostId", ["hostId"])
    .index("by_listingId", ["listingId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_guestId_status", ["guestId", "status"])
    .index("by_hostId_status", ["hostId", "status"])
    .index("by_accessToken", ["accessToken"]),

  bookingParticipants: defineTable({
    bookingId: v.id("bookings"),
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    inviteCode: v.optional(v.string()),
    role: v.union(
      v.literal("primary"),
      v.literal("invited"),
      v.literal("open_spot")
    ),
    status: v.union(
      v.literal("confirmed"),
      v.literal("pending"),
      v.literal("declined"),
      v.literal("cancelled")
    ),
    shareCents: v.number(),
    hasPaid: v.boolean(),
    joinedAt: v.number(),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_userId", ["userId"])
    .index("by_inviteCode", ["inviteCode"]),

  conversations: defineTable({
    listingId: v.optional(v.id("listings")),
    bookingId: v.optional(v.id("bookings")),
    participantIds: v.array(v.id("users")),
    type: v.union(
      v.literal("inquiry"),
      v.literal("booking"),
      v.literal("support")
    ),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_listingId", ["listingId"])
    .index("by_bookingId", ["bookingId"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("system")
    ),
    imageId: v.optional(v.id("_storage")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"]),

  reviews: defineTable({
    bookingId: v.id("bookings"),
    listingId: v.id("listings"),
    reviewerId: v.id("users"),
    hostId: v.id("users"),
    rating: v.number(),
    ratingFishing: v.optional(v.number()),
    ratingBoat: v.optional(v.number()),
    ratingCaptain: v.optional(v.number()),
    ratingValue: v.optional(v.number()),
    title: v.optional(v.string()),
    body: v.string(),
    photos: v.optional(v.array(v.id("_storage"))),
    hostResponse: v.optional(v.string()),
    hostRespondedAt: v.optional(v.number()),
    isPublished: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_listingId", ["listingId"])
    .index("by_reviewerId", ["reviewerId"])
    .index("by_hostId", ["hostId"])
    .index("by_bookingId", ["bookingId"]),

  favorites: defineTable({
    userId: v.id("users"),
    listingId: v.id("listings"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_listingId", ["userId", "listingId"]),

  adminLogs: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetType: v.union(
      v.literal("user"),
      v.literal("listing"),
      v.literal("booking"),
      v.literal("review")
    ),
    targetId: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_adminId", ["adminId"])
    .index("by_targetType", ["targetType"])
    .index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("booking_request"),
      v.literal("booking_confirmed"),
      v.literal("booking_cancelled"),
      v.literal("new_message"),
      v.literal("new_review"),
      v.literal("cost_share_invite"),
      v.literal("cost_share_joined"),
      v.literal("payout_sent"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),
});
