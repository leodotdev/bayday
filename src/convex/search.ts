import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchListings = query({
  args: {
    searchTerm: v.optional(v.string()),
    tripType: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    date: v.optional(v.string()),
    dateEnd: v.optional(v.string()),
    minPriceCents: v.optional(v.number()),
    maxPriceCents: v.optional(v.number()),
    minDurationHours: v.optional(v.number()),
    maxDurationHours: v.optional(v.number()),
    captainIncluded: v.optional(v.boolean()),
    instantBook: v.optional(v.boolean()),
    includesEquipment: v.optional(v.boolean()),
    includesBait: v.optional(v.boolean()),
    includesLunch: v.optional(v.boolean()),
    minGuests: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("price_asc"),
        v.literal("price_desc"),
        v.literal("rating"),
        v.literal("reviews"),
        v.literal("newest")
      )
    ),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();

      // Title search via index
      const titleResults = await ctx.db
        .query("listings")
        .withSearchIndex("search_title", (q) => {
          let search = q.search("title", args.searchTerm!);
          search = search.eq("status", "published");
          if (args.tripType) search = search.eq("tripType", args.tripType as any);
          if (args.city) search = search.eq("departureCity", args.city);
          if (args.state) search = search.eq("departureState", args.state);
          return search;
        })
        .collect();

      // Broad match on location, species, description, trip type
      const allPublished = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();

      const titleIds = new Set(titleResults.map((l) => l._id));
      const broadMatches = allPublished.filter((l) => {
        if (titleIds.has(l._id)) return false; // already in title results
        const haystack = [
          l.departureCity,
          l.departureState,
          l.departurePort,
          l.description,
          l.tripType.replace(/_/g, " "),
          ...l.targetSpecies,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });

      results = [...titleResults, ...broadMatches];

      // Apply location/type filters to broad matches
      if (args.tripType) {
        results = results.filter((l) => l.tripType === args.tripType);
      }
      if (args.city) {
        results = results.filter((l) => l.departureCity === args.city);
      }
      if (args.state) {
        results = results.filter((l) => l.departureState === args.state);
      }
    } else {
      results = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();

      if (args.tripType) {
        results = results.filter((l) => l.tripType === args.tripType);
      }
      if (args.city) {
        results = results.filter((l) => l.departureCity === args.city);
      }
      if (args.state) {
        results = results.filter((l) => l.departureState === args.state);
      }
    }

    // Apply additional filters
    if (args.minPriceCents !== undefined) {
      results = results.filter((l) => l.priceCents >= args.minPriceCents!);
    }
    if (args.maxPriceCents !== undefined) {
      results = results.filter((l) => l.priceCents <= args.maxPriceCents!);
    }
    if (args.minDurationHours !== undefined) {
      results = results.filter(
        (l) => l.durationHours >= args.minDurationHours!
      );
    }
    if (args.maxDurationHours !== undefined) {
      results = results.filter(
        (l) => l.durationHours <= args.maxDurationHours!
      );
    }
    if (args.captainIncluded !== undefined) {
      results = results.filter(
        (l) => l.captainIncluded === args.captainIncluded
      );
    }
    if (args.instantBook !== undefined) {
      results = results.filter((l) => l.instantBook === args.instantBook);
    }
    if (args.includesEquipment !== undefined) {
      results = results.filter(
        (l) => l.includesEquipment === args.includesEquipment
      );
    }
    if (args.includesBait !== undefined) {
      results = results.filter((l) => l.includesBait === args.includesBait);
    }
    if (args.includesLunch !== undefined) {
      results = results.filter((l) => l.includesLunch === args.includesLunch);
    }
    if (args.minGuests !== undefined) {
      results = results.filter((l) => l.maxGuests >= args.minGuests!);
    }

    // Filter by date availability (single date or range)
    if (args.date) {
      const startDate = args.date;
      const endDate = args.dateEnd ?? args.date;

      // Collect all dates in the range
      const datesToCheck: string[] = [];
      const current = new Date(startDate + "T12:00:00");
      const end = new Date(endDate + "T12:00:00");
      while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const d = String(current.getDate()).padStart(2, "0");
        datesToCheck.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
      }

      // Query availability for all dates in range
      const allSlots = await Promise.all(
        datesToCheck.map((date) =>
          ctx.db
            .query("availability")
            .withIndex("by_date", (q) => q.eq("date", date))
            .collect()
        )
      );
      const flatSlots = allSlots.flat();

      // A listing is available if it has an available slot for ALL dates in range,
      // or has no availability entries at all (open by default)
      const listingsWithAvailability = new Set(flatSlots.map((s) => s.listingId));

      const availableByDate = new Map<string, Set<string>>();
      for (const slot of flatSlots) {
        if (slot.isAvailable) {
          const key = slot.listingId.toString();
          if (!availableByDate.has(key)) availableByDate.set(key, new Set());
          availableByDate.get(key)!.add(slot.date);
        }
      }

      results = results.filter((l) => {
        if (!listingsWithAvailability.has(l._id)) return true; // no availability = open
        const available = availableByDate.get(l._id.toString());
        if (!available) return false;
        return datesToCheck.every((date) => available.has(date));
      });
    }

    // Sort
    const sortBy = args.sortBy ?? "newest";
    switch (sortBy) {
      case "price_asc":
        results.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price_desc":
        results.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "rating":
        results.sort(
          (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)
        );
        break;
      case "reviews":
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "newest":
        results.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // Enrich with boat and host data
    const enriched = await Promise.all(
      results.map(async (listing) => {
        const boat = await ctx.db.get(listing.boatId);
        const host = await ctx.db.get(listing.hostId);
        return { ...listing, boat, host };
      })
    );

    return enriched;
  },
});

export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const tripTypes = [...new Set(published.map((l) => l.tripType))].sort();
    const cities = [...new Set(published.map((l) => l.departureCity))].sort();
    const states = [...new Set(published.map((l) => l.departureState))].sort();

    const allSpecies = published.flatMap((l) => l.targetSpecies);
    const species = [...new Set(allSpecies)].sort();

    const prices = published.map((l) => l.priceCents);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const durations = published.map((l) => l.durationHours);
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

    return {
      tripTypes,
      cities,
      states,
      species,
      priceRange: { min: minPrice, max: maxPrice },
      durationRange: { min: minDuration, max: maxDuration },
      totalListings: published.length,
    };
  },
});

export const getTrending = query({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Score by combination of reviews and rating
    const scored = published.map((listing) => ({
      listing,
      score:
        listing.reviewCount * 0.6 +
        (listing.averageRating ?? 0) * listing.reviewCount * 0.4,
    }));

    scored.sort((a, b) => b.score - a.score);

    const top10 = scored.slice(0, 10);

    const enriched = await Promise.all(
      top10.map(async ({ listing }) => {
        const boat = await ctx.db.get(listing.boatId);
        const host = await ctx.db.get(listing.hostId);
        return { ...listing, boat, host };
      })
    );

    return enriched;
  },
});

export const getNearby = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusMiles: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radiusMiles = args.radiusMiles ?? 50;

    const published = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Haversine distance calculation
    function haversineDistanceMiles(
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number {
      const R = 3958.8; // Earth radius in miles
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const withDistance = published
      .map((listing) => {
        const distance = haversineDistanceMiles(
          args.latitude,
          args.longitude,
          listing.departureLatitude,
          listing.departureLongitude
        );
        return { listing, distance };
      })
      .filter(({ distance }) => distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    const enriched = await Promise.all(
      withDistance.map(async ({ listing, distance }) => {
        const boat = await ctx.db.get(listing.boatId);
        const host = await ctx.db.get(listing.hostId);
        return { ...listing, boat, host, distanceMiles: Math.round(distance * 10) / 10 };
      })
    );

    return enriched;
  },
});
