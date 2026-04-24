import { internalMutation, query } from "./_generated/server";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({ id: u._id, email: u.email, role: u.role }));
  },
});

export const deduplicateUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    // Group by lowercase email
    const byEmail = new Map<string, typeof allUsers>();
    for (const user of allUsers) {
      const key = user.email?.toLowerCase() ?? user._id;
      const group = byEmail.get(key) ?? [];
      group.push(user);
      byEmail.set(key, group);
    }

    let merged = 0;
    for (const [email, group] of byEmail) {
      if (group.length <= 1) continue;

      // Keep the one with role=admin, then host, then oldest
      group.sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;
        if (a.role === "host" && b.role !== "host") return -1;
        if (b.role === "host" && a.role !== "host") return 1;
        return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      });

      const keeper = group[0];
      const dupes = group.slice(1);

      console.log(`Keeping user ${keeper._id} (${email}), removing ${dupes.length} dupes`);

      // Normalize email to lowercase
      const patch: Record<string, any> = {};
      if (keeper.email && keeper.email !== keeper.email.toLowerCase()) {
        patch.email = keeper.email.toLowerCase();
      }
      if (!keeper.firstName) {
        const withName = dupes.find((d) => d.firstName);
        if (withName) patch.firstName = withName.firstName;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(keeper._id, patch);
      }

      for (const dupe of dupes) {
        const convos = await ctx.db.query("conversations").collect();
        for (const c of convos) {
          if (c.participantIds.includes(dupe._id)) {
            const newIds = c.participantIds.map((id) =>
              id === dupe._id ? keeper._id : id
            );
            await ctx.db.patch(c._id, { participantIds: [...new Set(newIds)] });
          }
        }

        const msgs = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("senderId"), dupe._id))
          .collect();
        for (const m of msgs) {
          await ctx.db.patch(m._id, { senderId: keeper._id });
        }

        const favs = await ctx.db
          .query("favorites")
          .withIndex("by_userId", (q) => q.eq("userId", dupe._id))
          .collect();
        for (const f of favs) {
          await ctx.db.patch(f._id, { userId: keeper._id });
        }

        const bookings = await ctx.db
          .query("bookings")
          .filter((q) => q.eq(q.field("guestId"), dupe._id))
          .collect();
        for (const b of bookings) {
          await ctx.db.patch(b._id, { guestId: keeper._id });
        }

        await ctx.db.delete(dupe._id);
        merged++;
      }
    }

    // Delete orphan users with no email (created by auth before createOrGet)
    let orphans = 0;
    for (const user of allUsers) {
      if (!user.email) {
        // Check if they have any real data
        const bookings = await ctx.db
          .query("bookings")
          .filter((q) => q.eq(q.field("guestId"), user._id))
          .first();
        const convos = await ctx.db.query("conversations").collect();
        const inConvo = convos.some((c) => c.participantIds.includes(user._id));

        if (!bookings && !inConvo) {
          console.log(`Deleting orphan user ${user._id} (no email, no data)`);
          await ctx.db.delete(user._id);
          orphans++;
        }
      }
    }

    console.log(`✅ Merged ${merged} dupes, deleted ${orphans} orphans.`);
  },
});
