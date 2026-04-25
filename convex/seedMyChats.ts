import { internalMutation } from "./_generated/server";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find Leo — try by email first, then fall back to scanning
    let leo = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "leo@leo.dev"))
      .unique();

    if (!leo) {
      // Scan for any user with leo email (case-insensitive)
      const allUsers = await ctx.db.query("users").collect();
      leo = allUsers.find((u) => u.email?.toLowerCase() === "leo@leo.dev") ?? null;
    }

    if (!leo) {
      console.log("❌ User leo@leo.dev not found — sign up first, then re-run");
      return;
    }

    // Ensure Leo has role and email set
    await ctx.db.patch(leo._id, {
      role: "admin",
      email: "leo@leo.dev",
      firstName: leo.firstName || "Leo",
    });
    console.log("✅ Set leo@leo.dev role to admin");

    // Clean up any existing conversations for leo first
    const allConvos = await ctx.db.query("conversations").collect();
    const leoConvos = allConvos.filter((c) =>
      c.participantIds.includes(leo!._id)
    );
    for (const convo of leoConvos) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", convo._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(convo._id);
    }
    console.log(`🗑️ Cleaned up ${leoConvos.length} existing conversations for leo`);

    // Find or create hosts
    const findOrCreateHost = async (
      email: string,
      firstName: string,
      lastName: string,
      bio: string
    ) => {
      let host = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (!host) {
        const id = await ctx.db.insert("users", {
          email,
          firstName,
          lastName,
          role: "host",
          bio,
          isVerified: true,
          isBanned: false,
          createdAt: now - 90 * 86400000,
        });
        host = (await ctx.db.get(id))!;
      }
      return host;
    };

    const mike = await findOrCreateHost(
      "captain.mike@anglersday.com",
      "Mike",
      "Torres",
      "25 years of offshore fishing experience in the Gulf. USCG licensed captain."
    );
    const sarah = await findOrCreateHost(
      "captain.sarah@anglersday.com",
      "Sarah",
      "Chen",
      "Fly fishing guide specializing in redfish and tarpon along the Florida coast."
    );
    const james = await findOrCreateHost(
      "captain.james@anglersday.com",
      "James",
      "Wright",
      "Deep sea fishing veteran. 15+ years running charters out of Key West."
    );

    // Find listings for context
    const mikeListing = await ctx.db
      .query("listings")
      .withIndex("by_hostId", (q) => q.eq("hostId", mike._id))
      .first();
    const sarahListing = await ctx.db
      .query("listings")
      .withIndex("by_hostId", (q) => q.eq("hostId", sarah._id))
      .first();
    const jamesListing = await ctx.db
      .query("listings")
      .withIndex("by_hostId", (q) => q.eq("hostId", james._id))
      .first();

    // --- Convo with Captain Mike: Planning a group trip ---
    const convoMike = await ctx.db.insert("conversations", {
      listingId: mikeListing?._id,
      participantIds: [leo._id, mike._id],
      type: "inquiry",
      lastMessageAt: now - 20 * 60000,
      lastMessagePreview:
        "I'll put you down for the 15th. Going to be an epic day!",
      isArchived: false,
      createdAt: now - 3 * 86400000,
    });

    const mikeMessages = [
      { sender: leo._id, body: "Hey Captain Mike! I'm planning a trip with some buddies — probably 5 or 6 of us. What's the best option for a full day offshore?", ago: 3 * 86400000 },
      { sender: mike._id, body: "Hey! For a group that size the 36ft Yellowfin is perfect — fits 6 comfortably with plenty of room to fight fish. Full day gets you out to the deep water where we've been crushing mahi and tuna lately.", ago: 2.5 * 86400000 },
      { sender: leo._id, body: "That's exactly what we're after. What are the chances we hook into a sailfish this time of year?", ago: 2 * 86400000 },
      { sender: mike._id, body: "Actually really good right now! We released 3 sails last week. The bite's been hot with the current pushing warm water in. I'd say 50/50 on any given day, but we'll definitely put baits out for them.", ago: 1.5 * 86400000 },
      { sender: leo._id, body: "Sold. Can we do the 15th? Also — two of the guys have never been deep sea fishing. That going to be ok?", ago: 1 * 86400000 },
      { sender: mike._id, body: "No worries at all, I love taking first-timers out. I'll walk everyone through everything before we leave the dock. And the 15th is wide open.", ago: 12 * 3600000 },
      { sender: leo._id, body: "Let's lock it in then!", ago: 4 * 3600000 },
      { sender: mike._id, body: "I'll put you down for the 15th. Going to be an epic day!", ago: 20 * 60000, unread: true },
    ];

    for (const msg of mikeMessages) {
      await ctx.db.insert("messages", {
        conversationId: convoMike,
        senderId: msg.sender,
        body: msg.body,
        type: "text",
        isRead: !msg.unread,
        createdAt: now - msg.ago,
      });
    }

    // --- Convo with Captain Sarah: Fly fishing for redfish ---
    const convoSarah = await ctx.db.insert("conversations", {
      listingId: sarahListing?._id,
      participantIds: [leo._id, sarah._id],
      type: "inquiry",
      lastMessageAt: now - 2 * 3600000,
      lastMessagePreview:
        "You'll be hooked (pun intended). The flats are fishing really well right now.",
      isArchived: false,
      createdAt: now - 4 * 86400000,
    });

    const sarahMessages = [
      { sender: leo._id, body: "Hi Sarah! I've always wanted to try fly fishing for redfish. I have some freshwater fly experience — how different is it?", ago: 4 * 86400000 },
      { sender: sarah._id, body: "It's a whole different world but your casting skills will transfer. The biggest difference is sight fishing — we're looking for tailing reds on the flats, then making precise casts. It's more like hunting than fishing!", ago: 3.5 * 86400000 },
      { sender: leo._id, body: "That sounds incredible. What weight rod should I bring? I've got a 5 and an 8.", ago: 3 * 86400000 },
      { sender: sarah._id, body: "Bring the 8 for sure — you'll need the backbone for reds. But honestly, I have top-of-the-line Orvis setups on the skiff so you're welcome to use mine. Less to pack!", ago: 2 * 86400000 },
      { sender: leo._id, body: "I might just use yours then. Never fished with Orvis gear, would be fun to try. How early do we need to be on the water?", ago: 1 * 86400000 },
      { sender: sarah._id, body: "You'll be hooked (pun intended). The flats are fishing really well right now.", ago: 2 * 3600000, unread: true },
    ];

    for (const msg of sarahMessages) {
      await ctx.db.insert("messages", {
        conversationId: convoSarah,
        senderId: msg.sender,
        body: msg.body,
        type: "text",
        isRead: !msg.unread,
        createdAt: now - msg.ago,
      });
    }

    // --- Convo with Captain James: Deep sea trip ---
    const convoJames = await ctx.db.insert("conversations", {
      listingId: jamesListing?._id,
      participantIds: [leo._id, james._id],
      type: "inquiry",
      lastMessageAt: now - 6 * 3600000,
      lastMessagePreview:
        "Do you guys do catch-and-cook? Would love to take some mahi home.",
      isArchived: false,
      createdAt: now - 1 * 86400000,
    });

    const jamesMessages = [
      { sender: leo._id, body: "Captain James — your deep sea charter looks awesome. What's been biting lately off Key West?", ago: 1 * 86400000 },
      { sender: james._id, body: "Thanks man! Right now we're seeing great mahi runs, plus yellowfin tuna on the deeper edges. Had a client land a 45lb bull dolphin yesterday — it was insane.", ago: 18 * 3600000 },
      { sender: leo._id, body: "Do you guys do catch-and-cook? Would love to take some mahi home.", ago: 6 * 3600000 },
    ];

    for (const msg of jamesMessages) {
      await ctx.db.insert("messages", {
        conversationId: convoJames,
        senderId: msg.sender,
        body: msg.body,
        type: "text",
        isRead: true,
        createdAt: now - msg.ago,
      });
    }

    console.log(
      "✅ Seeded 3 conversations for leo@leo.dev with Captain Mike, Sarah, and James"
    );
  },
});
