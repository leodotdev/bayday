import { internalMutation } from "./_generated/server";

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Paginate to avoid the 4096 reads-per-function limit. Returns the
    // total number of docs deleted in this call. Run repeatedly until 0.
    const tables = [
      "messages",
      "conversations",
      "bookingParticipants",
      "reviews",
      "bookings",
      "availability",
      "favorites",
      "notifications",
      "listings",
      "boats",
      "users",
    ] as const;

    const BATCH = 500;
    let deleted = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table).take(BATCH);
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        deleted++;
      }
      if (deleted >= BATCH) break;
    }
    console.log(`🗑️ Deleted ${deleted} docs in this batch`);
    return { deleted };
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }

    const now = Date.now();

    // --- HOSTS ---
    const host1 = await ctx.db.insert("users", {
      email: "captain.mike@anglersday.com",
      firstName: "Mike",
      lastName: "Torres",
      role: "host",
      bio: "25 years of offshore fishing experience in the Gulf. USCG licensed captain.",
      isVerified: true,
      isBanned: false,
      createdAt: now - 90 * 86400000,
    });

    const host2 = await ctx.db.insert("users", {
      email: "captain.sarah@anglersday.com",
      firstName: "Sarah",
      lastName: "Chen",
      role: "host",
      bio: "Fly fishing guide specializing in redfish and tarpon along the Florida coast.",
      isVerified: true,
      isBanned: false,
      createdAt: now - 60 * 86400000,
    });

    const host3 = await ctx.db.insert("users", {
      email: "captain.james@anglersday.com",
      firstName: "James",
      lastName: "Wright",
      role: "host",
      bio: "Deep sea fishing veteran. 15+ years running charters out of Key West.",
      isVerified: true,
      isBanned: false,
      createdAt: now - 45 * 86400000,
    });

    // --- GUESTS ---
    const guest1 = await ctx.db.insert("users", {
      email: "alex@example.com",
      firstName: "Alex",
      lastName: "Johnson",
      role: "guest",
      isVerified: true,
      isBanned: false,
      createdAt: now - 30 * 86400000,
    });

    const guest2 = await ctx.db.insert("users", {
      email: "maria@example.com",
      firstName: "Maria",
      lastName: "Garcia",
      role: "guest",
      isVerified: true,
      isBanned: false,
      createdAt: now - 20 * 86400000,
    });

    const guest3 = await ctx.db.insert("users", {
      email: "david@example.com",
      firstName: "David",
      lastName: "Kim",
      role: "guest",
      isVerified: true,
      isBanned: false,
      createdAt: now - 15 * 86400000,
    });

    // --- EXTRA HOSTS ---
    const host4 = await ctx.db.insert("users", {
      email: "captain.rico@anglersday.com",
      firstName: "Rico",
      lastName: "Delgado",
      role: "host",
      bio: "Born and raised in the Keys. Third-generation fisherman specializing in backcountry and flats fishing.",
      isVerified: true,
      isBanned: false,
      createdAt: now - 120 * 86400000,
    });

    const host5 = await ctx.db.insert("users", {
      email: "captain.karen@anglersday.com",
      firstName: "Karen",
      lastName: "Blackwood",
      role: "host",
      bio: "Former marine biologist turned charter captain. Eco-friendly fishing trips with a focus on conservation.",
      isVerified: true,
      isBanned: false,
      createdAt: now - 100 * 86400000,
    });

    const host6 = await ctx.db.insert("users", {
      email: "captain.tommy@anglersday.com",
      firstName: "Tommy",
      lastName: "Nguyen",
      role: "host",
      bio: "20 years running charters on the Gulf Coast. Tournament angler and IGFA world record holder.",
      isVerified: true,
      isBanned: false,
      createdAt: now - 80 * 86400000,
    });

    // --- BOATS (15 total) ---
    const boat1 = await ctx.db.insert("boats", {
      hostId: host1,
      name: "Sea Hunter",
      type: "center_console",
      lengthFeet: 36,
      capacityGuests: 6,
      yearBuilt: 2021,
      manufacturer: "Yellowfin",
      model: "36 Offshore",
      description: "Triple Mercury 300hp, fully equipped for offshore fishing with live well, outriggers, and top-of-the-line electronics.",
      photos: [],
      amenities: ["Live Well", "Outriggers", "GPS/Fish Finder", "Bluetooth Speakers", "Shade Top", "Cooler"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB"],
      isActive: true,
      createdAt: now - 90 * 86400000,
    });

    const boat2 = await ctx.db.insert("boats", {
      hostId: host2,
      name: "Coastal Drifter",
      type: "center_console",
      lengthFeet: 22,
      capacityGuests: 4,
      yearBuilt: 2022,
      manufacturer: "Hewes",
      model: "Redfisher 21",
      description: "Shallow-draft flats boat perfect for inshore and fly fishing. Trolling motor, poling platform, and pristine condition.",
      photos: [],
      amenities: ["Trolling Motor", "Poling Platform", "Live Well", "GPS/Fish Finder", "Fly Rod Holders"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio"],
      isActive: true,
      createdAt: now - 60 * 86400000,
    });

    const boat3 = await ctx.db.insert("boats", {
      hostId: host3,
      name: "Big Game",
      type: "sportfisher",
      lengthFeet: 52,
      capacityGuests: 10,
      yearBuilt: 2019,
      manufacturer: "Viking",
      model: "52 Open",
      description: "Tournament-ready sportfisher with fighting chair, tuna tower, and full cabin with A/C. Perfect for serious anglers.",
      photos: [],
      amenities: ["Fighting Chair", "Tuna Tower", "A/C Cabin", "Full Kitchen", "Bathroom", "Live Well", "Outriggers", "Bluetooth Speakers"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB", "Life Raft"],
      isActive: true,
      createdAt: now - 45 * 86400000,
    });

    const boat4 = await ctx.db.insert("boats", {
      hostId: host1,
      name: "Bay Runner",
      type: "center_console",
      lengthFeet: 24,
      capacityGuests: 4,
      yearBuilt: 2023,
      manufacturer: "Pathfinder",
      model: "2400 TRS",
      description: "Versatile bay boat that handles both inshore flats and nearshore reefs with ease.",
      photos: [],
      amenities: ["Live Well", "Trolling Motor", "GPS/Fish Finder", "Shade Top", "Cooler"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio"],
      isActive: true,
      createdAt: now - 30 * 86400000,
    });

    const boat5 = await ctx.db.insert("boats", {
      hostId: host2,
      name: "Sunset Skipper",
      type: "catamaran",
      lengthFeet: 34,
      capacityGuests: 8,
      yearBuilt: 2020,
      manufacturer: "World Cat",
      model: "340 DC",
      description: "Stable catamaran hull perfect for families and sunset cruises. Smooth ride even in choppy conditions.",
      photos: [],
      amenities: ["Dual Hulls", "Shade Top", "Bluetooth Speakers", "Cooler", "Swim Platform", "Bathroom"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares"],
      isActive: true,
      createdAt: now - 40 * 86400000,
    });

    const boat6 = await ctx.db.insert("boats", {
      hostId: host4,
      name: "Mangrove Ghost",
      type: "center_console",
      lengthFeet: 18,
      capacityGuests: 3,
      yearBuilt: 2024,
      manufacturer: "Maverick",
      model: "18 HPX-V",
      description: "Ultra-shallow technical poling skiff built for skinny water. Drafts just 6 inches. The ultimate backcountry machine.",
      photos: [],
      amenities: ["Poling Platform", "Trolling Motor", "Push Pole", "GPS/Fish Finder", "Fly Rod Holders"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio"],
      isActive: true,
      createdAt: now - 110 * 86400000,
    });

    const boat7 = await ctx.db.insert("boats", {
      hostId: host4,
      name: "Tide Chaser",
      type: "center_console",
      lengthFeet: 26,
      capacityGuests: 5,
      yearBuilt: 2022,
      manufacturer: "Robalo",
      model: "R260",
      description: "Versatile center console with twin Yamaha 200s. Great for nearshore and offshore runs up to 30 miles.",
      photos: [],
      amenities: ["Live Well", "GPS/Fish Finder", "Shade Top", "Cooler", "Rod Holders", "Outriggers"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares"],
      isActive: true,
      createdAt: now - 95 * 86400000,
    });

    const boat8 = await ctx.db.insert("boats", {
      hostId: host5,
      name: "Coral Queen",
      type: "catamaran",
      lengthFeet: 40,
      capacityGuests: 12,
      yearBuilt: 2021,
      manufacturer: "Lagoon",
      model: "40",
      description: "Spacious sailing catamaran converted for eco-fishing tours. Solar-powered, quiet, and comfortable with full galley.",
      photos: [],
      amenities: ["Full Galley", "Solar Power", "Bathroom", "Shade Bimini", "Swim Ladder", "Bluetooth Speakers", "Snorkeling Gear"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB", "Life Raft"],
      isActive: true,
      createdAt: now - 90 * 86400000,
    });

    const boat9 = await ctx.db.insert("boats", {
      hostId: host5,
      name: "Green Tide",
      type: "pontoon",
      lengthFeet: 28,
      capacityGuests: 10,
      yearBuilt: 2023,
      manufacturer: "Bennington",
      model: "28 QXSB",
      description: "Luxury pontoon boat perfect for family fishing parties and casual reef fishing. Extremely stable platform.",
      photos: [],
      amenities: ["Shade Top", "Bluetooth Speakers", "Cooler", "Swim Platform", "Table & Seating", "USB Charging"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio"],
      isActive: true,
      createdAt: now - 75 * 86400000,
    });

    const boat10 = await ctx.db.insert("boats", {
      hostId: host6,
      name: "Gulf Fury",
      type: "sportfisher",
      lengthFeet: 45,
      capacityGuests: 8,
      yearBuilt: 2020,
      manufacturer: "Cabo",
      model: "45 Express",
      description: "Fast express sportfisher with CAT diesels. Gets to the fishing grounds quickly and fights big fish all day long.",
      photos: [],
      amenities: ["Fighting Chair", "Tuna Tower", "A/C Cabin", "Bathroom", "Live Well", "Outriggers", "Cooler"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB"],
      isActive: true,
      createdAt: now - 70 * 86400000,
    });

    const boat11 = await ctx.db.insert("boats", {
      hostId: host6,
      name: "Amberjack",
      type: "center_console",
      lengthFeet: 32,
      capacityGuests: 6,
      yearBuilt: 2023,
      manufacturer: "Regulator",
      model: "34",
      description: "Premium center console with twin 350s. Deep-V hull eats up rough seas. Built for all-weather offshore fishing.",
      photos: [],
      amenities: ["Live Well", "Outriggers", "GPS/Fish Finder", "Shade Top", "Cooler", "Rod Holders", "Bluetooth Speakers"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB"],
      isActive: true,
      createdAt: now - 55 * 86400000,
    });

    const boat12 = await ctx.db.insert("boats", {
      hostId: host3,
      name: "Reef Stalker",
      type: "center_console",
      lengthFeet: 28,
      capacityGuests: 6,
      yearBuilt: 2022,
      manufacturer: "Boston Whaler",
      model: "280 Outrage",
      description: "Unsinkable Boston Whaler with twin Mercury 250s. Perfect for reef fishing and short offshore runs.",
      photos: [],
      amenities: ["Live Well", "GPS/Fish Finder", "Shade Top", "Cooler", "Rod Holders", "Swim Platform"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares"],
      isActive: true,
      createdAt: now - 38 * 86400000,
    });

    const boat13 = await ctx.db.insert("boats", {
      hostId: host1,
      name: "Night Owl",
      type: "center_console",
      lengthFeet: 30,
      capacityGuests: 5,
      yearBuilt: 2021,
      manufacturer: "Contender",
      model: "30 ST",
      description: "Rigged for night sword fishing with underwater lights, electric reels, and heavy-duty tackle. Steps hull for a dry ride.",
      photos: [],
      amenities: ["Underwater Lights", "Electric Reels", "GPS/Fish Finder", "Shade Top", "Cooler", "Rod Holders"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB"],
      isActive: true,
      createdAt: now - 25 * 86400000,
    });

    const boat14 = await ctx.db.insert("boats", {
      hostId: host4,
      name: "Flat Out",
      type: "kayak",
      lengthFeet: 13,
      capacityGuests: 1,
      yearBuilt: 2024,
      manufacturer: "Hobie",
      model: "Pro Angler 14",
      description: "Top-of-the-line pedal-drive fishing kayak with MirageDrive 360. Silent approach for spooky flats fish.",
      photos: [],
      amenities: ["Pedal Drive", "Rod Holders", "Fish Finder", "Anchor", "Tackle Storage"],
      safetyEquipment: ["Life Jacket", "Whistle", "First Aid Kit"],
      isActive: true,
      createdAt: now - 15 * 86400000,
    });

    const boat15 = await ctx.db.insert("boats", {
      hostId: host5,
      name: "Sea Breeze",
      type: "sailboat",
      lengthFeet: 38,
      capacityGuests: 6,
      yearBuilt: 2018,
      manufacturer: "Beneteau",
      model: "Oceanis 38.1",
      description: "Classic sailing yacht with trolling gear. Combine the romance of sailing with productive fishing on the Gulf Stream edge.",
      photos: [],
      amenities: ["Full Galley", "Bathroom", "Cabin Berths", "Shade Bimini", "Swim Ladder", "Rod Holders"],
      safetyEquipment: ["Life Jackets", "First Aid Kit", "Fire Extinguisher", "VHF Radio", "Flares", "EPIRB", "Life Raft"],
      isActive: true,
      createdAt: now - 85 * 86400000,
    });

    // --- LISTINGS ---
    const listing1 = await ctx.db.insert("listings", {
      hostId: host1,
      boatId: boat1,
      title: "Offshore Mahi & Tuna Adventure",
      description: "Head 30+ miles offshore in pursuit of mahi-mahi, yellowfin tuna, and wahoo. We target weed lines, floating debris, and deep structure. All tackle and bait provided. This is a full-day adventure for serious anglers looking for trophy catches.",
      tripType: "offshore",
      durationHours: 8,
      priceCents: 120000,
      priceType: "per_trip",
      maxGuests: 6,
      minGuests: 2,
      captainIncluded: true,
      captainName: "Captain Mike Torres",
      captainBio: "25 years of offshore experience, multiple tournament wins",
      targetSpecies: ["Mahi-Mahi", "Yellowfin Tuna", "Wahoo", "Sailfish"],
      departurePort: "Miami Beach Marina, Slip C-12",
      departureLatitude: 25.7689,
      departureLongitude: -80.1383,
      departureCity: "Miami Beach",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Ice & Cooler", "Fish Cleaning", "Bottled Water"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.8,
      reviewCount: 24,
      instantBook: false,
      createdAt: now - 85 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    const listing2 = await ctx.db.insert("listings", {
      hostId: host2,
      boatId: boat2,
      title: "Redfish Sight-Fishing on the Flats",
      description: "Experience the thrill of sight-casting to tailing redfish in crystal-clear shallow waters. Perfect for fly fishing enthusiasts and light tackle anglers. We pole the flats searching for singles, pairs, and schools of reds.",
      tripType: "fly_fishing",
      durationHours: 6,
      priceCents: 65000,
      priceType: "per_trip",
      maxGuests: 2,
      captainIncluded: true,
      captainName: "Captain Sarah Chen",
      captainBio: "Expert fly fishing guide, Orvis-endorsed",
      targetSpecies: ["Redfish", "Snook", "Spotted Seatrout"],
      departurePort: "Flamingo Marina, Everglades National Park",
      departureLatitude: 25.1414,
      departureLongitude: -80.9253,
      departureCity: "Homestead",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Fly Rods & Flies Provided", "Polarized Sunglasses", "Ice & Cooler"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.9,
      reviewCount: 31,
      instantBook: true,
      createdAt: now - 55 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const listing3 = await ctx.db.insert("listings", {
      hostId: host3,
      boatId: boat3,
      title: "Key West Deep Sea Fishing Expedition",
      description: "Battle the big ones aboard our 52ft Viking sportfisher. Target blue marlin, swordfish, and giant tuna in the deep waters off Key West. Full-day trip includes lunch, drinks, and all gear. Professional mate on board to assist.",
      tripType: "deep_sea",
      durationHours: 10,
      priceCents: 250000,
      priceType: "per_trip",
      maxGuests: 8,
      minGuests: 3,
      captainIncluded: true,
      captainName: "Captain James Wright",
      captainBio: "15+ years deep sea fishing, certified IGFA captain",
      targetSpecies: ["Blue Marlin", "Swordfish", "Yellowfin Tuna", "Blackfin Tuna", "Mahi-Mahi"],
      departurePort: "Key West Bight Marina, Slip 42",
      departureLatitude: 24.5616,
      departureLongitude: -81.8055,
      departureCity: "Key West",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Professional Mate", "Fish Cleaning & Packing", "Drinks & Snacks", "Fighting Belt"],
      cancellationPolicy: "strict",
      status: "published",
      averageRating: 4.7,
      reviewCount: 18,
      instantBook: false,
      createdAt: now - 40 * 86400000,
      updatedAt: now - 3 * 86400000,
    });

    const listing4 = await ctx.db.insert("listings", {
      hostId: host1,
      boatId: boat4,
      title: "Inshore Snook & Tarpon Trip",
      description: "Fish the mangroves, bridges, and passes for snook, tarpon, and jack crevalle. Half-day trip perfect for beginners and experienced anglers alike. Light tackle and live bait fishing at its finest.",
      tripType: "inshore",
      durationHours: 4,
      priceCents: 45000,
      priceType: "per_trip",
      maxGuests: 4,
      captainIncluded: true,
      captainName: "Captain Mike Torres",
      captainBio: "25 years of inshore expertise, knows every hidden spot",
      targetSpecies: ["Snook", "Tarpon", "Jack Crevalle", "Mangrove Snapper"],
      departurePort: "Haulover Park Marina, Slip B-7",
      departureLatitude: 25.9051,
      departureLongitude: -80.1232,
      departureCity: "Miami Beach",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Ice & Cooler", "Bottled Water"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.6,
      reviewCount: 42,
      instantBook: true,
      createdAt: now - 25 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const listing5 = await ctx.db.insert("listings", {
      hostId: host2,
      boatId: boat5,
      title: "Sunset Cruise & Bottom Fishing",
      description: "Enjoy a relaxing afternoon of bottom fishing followed by a stunning Florida Keys sunset. Great for families and groups. We anchor over reefs and wrecks for snapper, grouper, and yellowtail. The ride home under the stars is unforgettable.",
      tripType: "bottom_fishing",
      durationHours: 5,
      priceCents: 9500,
      priceType: "per_person",
      maxGuests: 8,
      minGuests: 2,
      captainIncluded: true,
      captainName: "Captain Sarah Chen",
      captainBio: "Family-friendly captain, great with kids and beginners",
      targetSpecies: ["Yellowtail Snapper", "Mangrove Snapper", "Grouper", "Hogfish"],
      departurePort: "Bud N' Mary's Marina, MM 79.8",
      departureLatitude: 24.9119,
      departureLongitude: -80.6286,
      departureCity: "Islamorada",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Ice & Cooler", "Fish Cleaning"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.5,
      reviewCount: 56,
      instantBook: true,
      createdAt: now - 35 * 86400000,
      updatedAt: now - 5 * 86400000,
    });

    const listing6 = await ctx.db.insert("listings", {
      hostId: host3,
      boatId: boat3,
      title: "Half-Day Reef & Wreck Trolling",
      description: "Troll the shallow reefs and wrecks around the Lower Keys for kingfish, cero mackerel, and cobia. Fast-paced action with plenty of bites. Great option if you don't have a full day but still want serious fishing.",
      tripType: "trolling",
      durationHours: 5,
      priceCents: 85000,
      priceType: "per_trip",
      maxGuests: 6,
      captainIncluded: true,
      captainName: "Captain James Wright",
      captainBio: "Reef trolling specialist, consistent producer",
      targetSpecies: ["King Mackerel", "Cero Mackerel", "Cobia", "Barracuda"],
      departurePort: "Stock Island Marina Village, Slip D-21",
      departureLatitude: 24.5683,
      departureLongitude: -81.7398,
      departureCity: "Stock Island",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Ice & Cooler", "Bottled Water", "Fish Cleaning"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.4,
      reviewCount: 12,
      instantBook: false,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 4 * 86400000,
    });

    const listing7 = await ctx.db.insert("listings", {
      hostId: host4,
      boatId: boat6,
      title: "Backcountry Bonefish & Permit",
      description: "Pole the pristine backcountry flats of the Lower Keys targeting bonefish, permit, and juvenile tarpon. Extreme shallow-water sight fishing at its best. Fly or light spin tackle. True skinny water adventure.",
      tripType: "fly_fishing",
      durationHours: 6,
      priceCents: 75000,
      priceType: "per_trip",
      maxGuests: 2,
      captainIncluded: true,
      captainName: "Captain Rico Delgado",
      captainBio: "Third-generation Keys guide, bonefish whisperer",
      targetSpecies: ["Bonefish", "Permit", "Juvenile Tarpon", "Barracuda"],
      departurePort: "Sugarloaf Marina, MM 17",
      departureLatitude: 24.6582,
      departureLongitude: -81.5267,
      departureCity: "Sugarloaf Key",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Fly Rods & Premium Flies", "Polarized Sunglasses", "Ice & Water"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.9,
      reviewCount: 67,
      instantBook: false,
      createdAt: now - 100 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    const listing8 = await ctx.db.insert("listings", {
      hostId: host4,
      boatId: boat7,
      title: "Keys Bridge Fishing — Tarpon Alley",
      description: "Fish the legendary bridges of the Florida Keys where giant tarpon migrate every spring. We anchor up on the current breaks with live crabs and mullet. Night trips available during tarpon season.",
      tripType: "inshore",
      durationHours: 5,
      priceCents: 55000,
      priceType: "per_trip",
      maxGuests: 4,
      captainIncluded: true,
      captainName: "Captain Rico Delgado",
      captainBio: "Bridge fishing specialist, 200+ tarpon landed per season",
      targetSpecies: ["Tarpon", "Snook", "Goliath Grouper", "Sharks"],
      departurePort: "Marathon Marina (Faro Blanco), MM 48.5",
      departureLatitude: 24.7181,
      departureLongitude: -81.0894,
      departureCity: "Marathon",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Heavy Tackle Provided", "Live Bait", "Ice & Cooler"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.7,
      reviewCount: 38,
      instantBook: true,
      createdAt: now - 80 * 86400000,
      updatedAt: now - 3 * 86400000,
    });

    const listing9 = await ctx.db.insert("listings", {
      hostId: host5,
      boatId: boat8,
      title: "Eco Sail & Fish Adventure",
      description: "A unique eco-friendly fishing experience aboard our solar-powered catamaran. Sail to pristine reef patches, fish sustainably with barbless hooks, and learn about marine conservation. Snorkeling included between fishing spots.",
      tripType: "bottom_fishing",
      durationHours: 7,
      priceCents: 12500,
      priceType: "per_person",
      maxGuests: 10,
      minGuests: 4,
      captainIncluded: true,
      captainName: "Captain Karen Blackwood",
      captainBio: "Marine biologist & USCG captain, passionate about ocean health",
      targetSpecies: ["Yellowtail Snapper", "Lane Snapper", "Hogfish", "Triggerfish"],
      departurePort: "Bahia Mar Yachting Center, Slip A-19",
      departureLatitude: 26.1156,
      departureLongitude: -80.1086,
      departureCity: "Fort Lauderdale",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Organic Lunch", "Snorkeling Gear", "Marine Biology Talk", "Fish ID Guide"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.8,
      reviewCount: 89,
      instantBook: true,
      createdAt: now - 88 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const listing10 = await ctx.db.insert("listings", {
      hostId: host5,
      boatId: boat9,
      title: "Family Fun Reef Fishing Party",
      description: "The most kid-friendly charter in South Florida! Our stable pontoon makes it easy for everyone to fish comfortably. We anchor over shallow reefs where the fish are plentiful and the action never stops. Perfect for birthdays and groups.",
      tripType: "bottom_fishing",
      durationHours: 4,
      priceCents: 7500,
      priceType: "per_person",
      maxGuests: 10,
      minGuests: 4,
      captainIncluded: true,
      captainName: "Captain Karen Blackwood",
      captainBio: "Incredibly patient with kids, makes fishing fun for everyone",
      targetSpecies: ["Yellowtail Snapper", "Grunt", "Porgy", "Triggerfish"],
      departurePort: "Westshore Yacht Club, Slip 24",
      departureLatitude: 27.8742,
      departureLongitude: -82.5278,
      departureCity: "Tampa",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Kid-Sized Rods", "Snacks & Juice Boxes", "Fish Cleaning"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.6,
      reviewCount: 124,
      instantBook: true,
      createdAt: now - 65 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    const listing11 = await ctx.db.insert("listings", {
      hostId: host6,
      boatId: boat10,
      title: "Gulf Stream Monster Hunt",
      description: "Chase trophy fish in the Gulf Stream aboard our fast express sportfisher. Blue marlin, sailfish, and giant yellowfin are all on the menu. Tournament-grade tackle and an experienced mate on board. This is big-game fishing at its finest.",
      tripType: "offshore",
      durationHours: 10,
      priceCents: 280000,
      priceType: "per_trip",
      maxGuests: 6,
      minGuests: 2,
      captainIncluded: true,
      captainName: "Captain Tommy Nguyen",
      captainBio: "IGFA record holder, 20+ years Gulf Stream experience",
      targetSpecies: ["Blue Marlin", "Sailfish", "Yellowfin Tuna", "Wahoo", "Dolphin"],
      departurePort: "Hillsboro Inlet Marina",
      departureLatitude: 26.2593,
      departureLongitude: -80.0794,
      departureCity: "Pompano Beach",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Professional Mate", "Tournament Tackle", "Lunch & Drinks", "Fish Cleaning & Packing"],
      cancellationPolicy: "strict",
      status: "published",
      averageRating: 4.9,
      reviewCount: 45,
      instantBook: false,
      createdAt: now - 60 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const listing12 = await ctx.db.insert("listings", {
      hostId: host6,
      boatId: boat11,
      title: "Kite Fishing for Sailfish",
      description: "Experience the exciting and visual art of kite fishing! We deploy kites to skip live baits across the surface, triggering explosive strikes from sailfish, mahi, and kingfish. One of the most thrilling methods in sportfishing.",
      tripType: "offshore",
      durationHours: 8,
      priceCents: 175000,
      priceType: "per_trip",
      maxGuests: 5,
      captainIncluded: true,
      captainName: "Captain Tommy Nguyen",
      captainBio: "South Florida kite fishing pioneer",
      targetSpecies: ["Sailfish", "Mahi-Mahi", "King Mackerel", "Tuna"],
      departurePort: "Sailfish Marina Resort, Slip 38",
      departureLatitude: 26.7794,
      departureLongitude: -80.0414,
      departureCity: "Palm Beach Shores",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Kite Fishing Gear", "Live Goggle Eyes", "Lunch & Drinks"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.8,
      reviewCount: 29,
      instantBook: false,
      createdAt: now - 45 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    const listing13 = await ctx.db.insert("listings", {
      hostId: host3,
      boatId: boat12,
      title: "Key West Reef Snapper Slam",
      description: "Anchor over the beautiful coral reefs near Key West and load up on snapper, grouper, and hogfish. Great for all skill levels. We provide everything — just show up and fish. Fresh catch can be taken to local restaurants for cook-up.",
      tripType: "bottom_fishing",
      durationHours: 4,
      priceCents: 8500,
      priceType: "per_person",
      maxGuests: 6,
      captainIncluded: true,
      captainName: "Captain James Wright",
      captainBio: "Knows every reef and wreck in the Lower Keys",
      targetSpecies: ["Yellowtail Snapper", "Mutton Snapper", "Red Grouper", "Hogfish"],
      departurePort: "Garrison Bight Marina, Slip 17",
      departureLatitude: 24.5621,
      departureLongitude: -81.7948,
      departureCity: "Key West",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Ice & Cooler", "Fish Cleaning", "Bottled Water"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.5,
      reviewCount: 78,
      instantBook: true,
      createdAt: now - 32 * 86400000,
      updatedAt: now - 3 * 86400000,
    });

    const listing14 = await ctx.db.insert("listings", {
      hostId: host1,
      boatId: boat13,
      title: "Nighttime Swordfish Expedition",
      description: "Drop deep under the stars for the ultimate trophy — broadbill swordfish. We deploy electric reels 1500+ feet down with specialized deep-drop rigs. Bucket list experience for serious anglers. Limited spots, book early.",
      tripType: "deep_sea",
      durationHours: 10,
      priceCents: 300000,
      priceType: "per_trip",
      maxGuests: 4,
      minGuests: 2,
      captainIncluded: true,
      captainName: "Captain Mike Torres",
      captainBio: "Deep-drop swordfish specialist, 50+ swords landed",
      targetSpecies: ["Swordfish", "Tilefish", "Queen Snapper", "Escolar"],
      departurePort: "Miami Beach Marina, Slip C-12",
      departureLatitude: 25.7689,
      departureLongitude: -80.1383,
      departureCity: "Miami Beach",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Electric Reels", "Underwater Lights", "Midnight Snack & Coffee", "Fish Cleaning"],
      cancellationPolicy: "strict",
      status: "published",
      averageRating: 4.7,
      reviewCount: 15,
      instantBook: false,
      createdAt: now - 18 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const listing15 = await ctx.db.insert("listings", {
      hostId: host4,
      boatId: boat14,
      title: "Guided Kayak Fishing — Flats Stealth",
      description: "The stealthiest way to fish the flats. Guided kayak fishing trip with premium Hobie pedal-drive kayaks. Approach bonefish, permit, and snook without spooking them. Includes full instruction for beginners.",
      tripType: "inshore",
      durationHours: 4,
      priceCents: 25000,
      priceType: "per_person",
      maxGuests: 1,
      captainIncluded: true,
      captainName: "Captain Rico Delgado",
      captainBio: "Kayak fishing champion, patient instructor",
      targetSpecies: ["Bonefish", "Snook", "Redfish", "Seatrout"],
      departurePort: "Geiger Key Marina, MM 10.5",
      departureLatitude: 24.5811,
      departureLongitude: -81.6533,
      departureCity: "Geiger Key",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Hobie Kayak Rental", "Tackle & Lures", "Water & Snacks"],
      cancellationPolicy: "flexible",
      status: "published",
      averageRating: 4.8,
      reviewCount: 53,
      instantBook: true,
      createdAt: now - 10 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const listing16 = await ctx.db.insert("listings", {
      hostId: host5,
      boatId: boat15,
      title: "Sail & Troll the Gulf Stream Edge",
      description: "A truly unique experience — sail to the Gulf Stream edge and troll for mahi, wahoo, and tuna under sail power. Eco-friendly, quiet, and incredibly peaceful. Overnight trips available for the adventurous.",
      tripType: "trolling",
      durationHours: 8,
      priceCents: 15000,
      priceType: "per_person",
      maxGuests: 4,
      minGuests: 2,
      captainIncluded: true,
      captainName: "Captain Karen Blackwood",
      captainBio: "Experienced sailor and conservationist",
      targetSpecies: ["Mahi-Mahi", "Wahoo", "Blackfin Tuna", "Kingfish"],
      departurePort: "Dinner Key Marina, Slip K-9",
      departureLatitude: 25.7280,
      departureLongitude: -80.2382,
      departureCity: "Coconut Grove",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Sailing Instruction", "Organic Lunch", "Trolling Gear"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.6,
      reviewCount: 34,
      instantBook: false,
      createdAt: now - 70 * 86400000,
      updatedAt: now - 5 * 86400000,
    });

    const listing17 = await ctx.db.insert("listings", {
      hostId: host6,
      boatId: boat10,
      title: "Wreck Fishing — Artificial Reef Run",
      description: "Hit the artificial reefs and wrecks 10-20 miles off Pompano Beach. Vertical jig and bottom fish for amberjack, snapper, grouper, and cobia. Fast-paced action on heavy tackle with big fish guaranteed.",
      tripType: "bottom_fishing",
      durationHours: 6,
      priceCents: 110000,
      priceType: "per_trip",
      maxGuests: 6,
      minGuests: 2,
      captainIncluded: true,
      captainName: "Captain Tommy Nguyen",
      captainBio: "Wreck fishing expert, knows every GPS number",
      targetSpecies: ["Amberjack", "Red Snapper", "Black Grouper", "Cobia", "African Pompano"],
      departurePort: "St. Petersburg Municipal Marina, Slip 88",
      departureLatitude: 27.7706,
      departureLongitude: -82.6312,
      departureCity: "St. Petersburg",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: false,
      customInclusions: ["Heavy Jigs Provided", "Ice & Cooler", "Fish Cleaning"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.7,
      reviewCount: 62,
      instantBook: true,
      createdAt: now - 50 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    const listing18 = await ctx.db.insert("listings", {
      hostId: host2,
      boatId: boat2,
      title: "Everglades Snook Slam",
      description: "Explore the remote creeks and oyster bars of Everglades National Park. Sight-cast to snook cruising mangrove shorelines. Light tackle and fly. One of the last truly wild fisheries in America.",
      tripType: "inshore",
      durationHours: 8,
      priceCents: 85000,
      priceType: "per_trip",
      maxGuests: 2,
      captainIncluded: true,
      captainName: "Captain Sarah Chen",
      captainBio: "Everglades backcountry specialist, Leave No Trace certified",
      targetSpecies: ["Snook", "Redfish", "Tarpon", "Black Drum"],
      departurePort: "Flamingo Marina, Everglades National Park",
      departureLatitude: 25.1414,
      departureLongitude: -80.9253,
      departureCity: "Homestead",
      departureState: "FL",
      includesEquipment: true,
      includesBait: true,
      includesLunch: true,
      customInclusions: ["Park Entry Fee", "Packed Lunch", "Fly Gear Available", "Bug Spray"],
      cancellationPolicy: "moderate",
      status: "published",
      averageRating: 4.9,
      reviewCount: 41,
      instantBook: false,
      createdAt: now - 48 * 86400000,
      updatedAt: now - 1 * 86400000,
    });

    const allListings = [listing1, listing2, listing3, listing4, listing5, listing6, listing7, listing8, listing9, listing10, listing11, listing12, listing13, listing14, listing15, listing16, listing17, listing18];

    // --- AVAILABILITY (next 90 days for each listing) ---
    // Simple seeded PRNG per listing for deterministic variety
    function seededRand(seed: number) {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    }
    for (let li = 0; li < allListings.length; li++) {
      const listingId = allListings[li];
      const rand = seededRand(li * 7919 + 42);
      // Look up base price for this listing
      const listingDoc = await ctx.db.get(listingId);
      const basePriceCents = listingDoc?.priceCents ?? 25000;

      for (let d = 1; d <= 365; d++) {
        const date = new Date(now + d * 86400000);
        const dateStr = date.toISOString().split("T")[0];
        const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

        const r = rand();
        // Some days have no availability at all (skip ~25%)
        if (r < 0.25) continue;

        // Weekend premium + random variation
        let priceMult = 1.0;
        if (dayOfWeek === 0 || dayOfWeek === 6) priceMult = 1.2;
        if (dayOfWeek === 5) priceMult = 1.1;
        priceMult *= 0.85 + rand() * 0.3;
        const customPriceCents = Math.round((basePriceCents * priceMult) / 500) * 500;

        // ~20% of available days are already booked (isAvailable = false)
        const r2 = rand();
        const isAvailable = r2 > 0.2;

        await ctx.db.insert("availability", {
          listingId,
          date: dateStr,
          startTime: "06:00",
          endTime: "14:00",
          isAvailable,
          customPriceCents,
        });
      }
    }

    // --- BOOKINGS ---
    const futureDate1 = new Date(now + 5 * 86400000).toISOString().split("T")[0];
    const futureDate2 = new Date(now + 8 * 86400000).toISOString().split("T")[0];
    const pastDate1 = new Date(now - 10 * 86400000).toISOString().split("T")[0];
    const pastDate2 = new Date(now - 20 * 86400000).toISOString().split("T")[0];

    await ctx.db.insert("bookings", {
      listingId: listing1,
      boatId: boat1,
      hostId: host1,
      guestId: guest1,
      date: futureDate1,
      startTime: "06:00",
      endTime: "14:00",
      partySize: 4,
      totalPriceCents: 120000,
      status: "confirmed",
      costSharingEnabled: false,
      hostPayoutCents: 108000,
      platformFeeCents: 12000,
      createdAt: now - 5 * 86400000,
      updatedAt: now - 4 * 86400000,
    });

    const booking2 = await ctx.db.insert("bookings", {
      listingId: listing2,
      boatId: boat2,
      hostId: host2,
      guestId: guest2,
      date: futureDate2,
      startTime: "07:00",
      endTime: "13:00",
      partySize: 2,
      totalPriceCents: 65000,
      status: "pending",
      costSharingEnabled: false,
      hostPayoutCents: 58500,
      platformFeeCents: 6500,
      createdAt: now - 2 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    const booking3 = await ctx.db.insert("bookings", {
      listingId: listing4,
      boatId: boat4,
      hostId: host1,
      guestId: guest3,
      date: pastDate1,
      startTime: "06:00",
      endTime: "10:00",
      partySize: 3,
      totalPriceCents: 45000,
      status: "completed",
      costSharingEnabled: false,
      hostPayoutCents: 40500,
      platformFeeCents: 4500,
      createdAt: now - 15 * 86400000,
      updatedAt: now - 10 * 86400000,
    });

    const booking4 = await ctx.db.insert("bookings", {
      listingId: listing5,
      boatId: boat5,
      hostId: host2,
      guestId: guest1,
      date: pastDate2,
      startTime: "15:00",
      endTime: "20:00",
      partySize: 6,
      totalPriceCents: 57000,
      status: "completed",
      costSharingEnabled: true,
      costSharingMaxSpots: 8,
      hostPayoutCents: 51300,
      platformFeeCents: 5700,
      createdAt: now - 25 * 86400000,
      updatedAt: now - 20 * 86400000,
    });

    // --- REVIEWS ---
    await ctx.db.insert("reviews", {
      bookingId: booking3,
      listingId: listing4,
      reviewerId: guest3,
      hostId: host1,
      rating: 5,
      ratingFishing: 5,
      ratingBoat: 4,
      ratingCaptain: 5,
      ratingValue: 5,
      title: "Best inshore trip ever!",
      body: "Captain Mike put us on fish from the moment we left the dock. Caught our limit of snook and even hooked into a huge tarpon. Highly recommend!",
      isPublished: true,
      createdAt: now - 9 * 86400000,
    });

    await ctx.db.insert("reviews", {
      bookingId: booking4,
      listingId: listing5,
      reviewerId: guest1,
      hostId: host2,
      rating: 4,
      ratingFishing: 4,
      ratingBoat: 5,
      ratingCaptain: 5,
      ratingValue: 4,
      title: "Perfect sunset experience",
      body: "The sunset was absolutely gorgeous and we caught plenty of yellowtail snapper for dinner. Captain Sarah was amazing with our kids. The catamaran was super stable and comfortable. Would do it again!",
      isPublished: true,
      createdAt: now - 19 * 86400000,
    });

    // --- CONVERSATIONS ---

    // Convo 1: Alex <-> Captain Mike — Offshore trip inquiry (6 messages)
    const convo1 = await ctx.db.insert("conversations", {
      listingId: listing1,
      participantIds: [guest1, host1],
      type: "inquiry",
      lastMessageAt: now - 1 * 3600000,
      lastMessagePreview: "Perfect, we'll be there bright and early. Can't wait!",
      isArchived: false,
      createdAt: now - 6 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: guest1,
      body: "Hi Captain Mike! We're a group of 4 coming down from Atlanta. Is there anything special we should bring for the offshore trip?",
      type: "text",
      isRead: true,
      createdAt: now - 6 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: host1,
      body: "Welcome! Just bring sunscreen, sunglasses, and a hat. We provide everything else including lunch and drinks. Wear comfortable shoes with non-marking soles.",
      type: "text",
      isRead: true,
      createdAt: now - 5 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: guest1,
      body: "Sounds great! Where exactly should we meet you at the marina?",
      type: "text",
      isRead: true,
      createdAt: now - 4 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: host1,
      body: "We'll be docked at slip C-12, look for the blue and white Yellowfin. Can't miss her.",
      type: "text",
      isRead: true,
      createdAt: now - 3 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: guest1,
      body: "One more question — any of your guys prone to seasickness tips? My buddy gets a little queasy on boats.",
      type: "text",
      isRead: true,
      createdAt: now - 2 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: host1,
      body: "Dramamine the night before and morning of works wonders. Also tell him to keep his eyes on the horizon. We keep ginger chews on board too. He'll be fine!",
      type: "text",
      isRead: true,
      createdAt: now - 2 * 86400000 + 3600000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo1,
      senderId: guest1,
      body: "Perfect, we'll be there bright and early. Can't wait!",
      type: "text",
      isRead: false,
      createdAt: now - 1 * 3600000,
    });

    // Convo 2: Maria <-> Captain James — Swordfish bucket list (5 messages)
    const convo2 = await ctx.db.insert("conversations", {
      listingId: listing3,
      participantIds: [guest2, host3],
      type: "inquiry",
      lastMessageAt: now - 4 * 3600000,
      lastMessagePreview: "That's so thoughtful, thank you! He's going to be thrilled.",
      isArchived: false,
      createdAt: now - 3 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo2,
      senderId: guest2,
      body: "Captain James, can we request a focus on swordfish for our trip? It's on my husband's bucket list.",
      type: "text",
      isRead: true,
      createdAt: now - 3 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo2,
      senderId: host3,
      body: "Absolutely! We've been seeing some great swordfish action about 20 miles out. I'll rig up the deep drop gear specifically for that. Does he have any deep sea experience?",
      type: "text",
      isRead: true,
      createdAt: now - 2.5 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo2,
      senderId: guest2,
      body: "He's done plenty of inshore stuff but never gone after the big game fish. He's a strong guy though and very patient.",
      type: "text",
      isRead: true,
      createdAt: now - 2 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo2,
      senderId: host3,
      body: "Perfect combo for swordfish! I'll walk him through everything. I also have a harness and fighting belt that makes a huge difference. We'll get him hooked up — literally!",
      type: "text",
      isRead: true,
      createdAt: now - 1 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo2,
      senderId: guest2,
      body: "That's so thoughtful, thank you! He's going to be thrilled.",
      type: "text",
      isRead: false,
      createdAt: now - 4 * 3600000,
    });

    // Convo 3: David <-> Captain Sarah — Booking follow-up (7 messages, most active)
    const convo3 = await ctx.db.insert("conversations", {
      listingId: listing2,
      bookingId: booking2,
      participantIds: [guest3, host2],
      type: "booking",
      lastMessageAt: now - 30 * 60000,
      lastMessagePreview: "Just pulled up to the marina, where should I park?",
      isArchived: false,
      createdAt: now - 5 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: host2,
      body: "Hi David! Your fly fishing trip is confirmed for this weekend. I wanted to check — have you fly fished before?",
      type: "system",
      isRead: true,
      createdAt: now - 5 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: guest3,
      body: "Hey Captain Sarah! Yeah, I've been fly fishing in rivers for years but never done saltwater. Super excited to try!",
      type: "text",
      isRead: true,
      createdAt: now - 4.5 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: host2,
      body: "Oh you'll love it. Saltwater fly is a totally different beast. We'll be sight-casting to redfish on the flats — it's incredibly visual and exciting. I'll have all the gear ready.",
      type: "text",
      isRead: true,
      createdAt: now - 4 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: guest3,
      body: "That sounds amazing. Should I bring my 8-weight or will you have rods?",
      type: "text",
      isRead: true,
      createdAt: now - 3 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: host2,
      body: "Bring it if you like your own gear! I have 8 and 9 weight setups with quality reels. Either way you're covered. Also — wear light colored clothing, the redfish spook easily.",
      type: "text",
      isRead: true,
      createdAt: now - 2 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: guest3,
      body: "Good tip on the clothing. I'll bring my rod just in case. What time should I be at the dock?",
      type: "text",
      isRead: true,
      createdAt: now - 1 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: host2,
      body: "Be there by 6:45 AM — we push off right at 7. The fish are most active in the early morning before the sun gets high. I'll text you the exact slip number day-of.",
      type: "text",
      isRead: true,
      createdAt: now - 12 * 3600000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo3,
      senderId: guest3,
      body: "Just pulled up to the marina, where should I park?",
      type: "text",
      isRead: false,
      createdAt: now - 30 * 60000,
    });

    // Convo 4: Alex <-> Captain Sarah — Sunset cruise inquiry (4 messages)
    const convo4 = await ctx.db.insert("conversations", {
      listingId: listing5,
      participantIds: [guest1, host2],
      type: "inquiry",
      lastMessageAt: now - 8 * 3600000,
      lastMessagePreview: "That sounds perfect for our anniversary. Booking now!",
      isArchived: false,
      createdAt: now - 2 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo4,
      senderId: guest1,
      body: "Hi Sarah! My wife and I are celebrating our 10th anniversary next month. Is the sunset cruise a good fit for a romantic evening?",
      type: "text",
      isRead: true,
      createdAt: now - 2 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo4,
      senderId: host2,
      body: "Congrats on 10 years! It's absolutely perfect for that. We get gorgeous sunsets over the Gulf, and the catamaran has a beautiful lounge area. You're welcome to bring your own champagne and snacks.",
      type: "text",
      isRead: true,
      createdAt: now - 1.5 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo4,
      senderId: guest1,
      body: "Do you ever see dolphins on the cruise?",
      type: "text",
      isRead: true,
      createdAt: now - 1 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo4,
      senderId: host2,
      body: "Almost every trip! The bottlenose dolphins love to play in our wake. Last week we had a pod of about 8 swimming alongside for a good 20 minutes. It's magical at sunset.",
      type: "text",
      isRead: true,
      createdAt: now - 10 * 3600000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo4,
      senderId: guest1,
      body: "That sounds perfect for our anniversary. Booking now!",
      type: "text",
      isRead: false,
      createdAt: now - 8 * 3600000,
    });

    // Convo 5: Maria <-> Captain Mike — Recent booking conversation (3 messages)
    const convo5 = await ctx.db.insert("conversations", {
      listingId: listing4,
      participantIds: [guest2, host1],
      type: "inquiry",
      lastMessageAt: now - 6 * 3600000,
      lastMessagePreview: "Great, we have plenty of kid-friendly gear. They'll have a blast!",
      isArchived: false,
      createdAt: now - 1 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo5,
      senderId: guest2,
      body: "Hi Captain Mike! I'm looking at your inshore trip. My kids are 8 and 10 — is this a good option for them?",
      type: "text",
      isRead: true,
      createdAt: now - 1 * 86400000,
    });

    await ctx.db.insert("messages", {
      conversationId: convo5,
      senderId: host1,
      body: "Great, we have plenty of kid-friendly gear. They'll have a blast!",
      type: "text",
      isRead: false,
      createdAt: now - 6 * 3600000,
    });

    console.log("✅ Seed complete: 9 users, 15 boats, 18 listings, 4 bookings, 2 reviews, 5 conversations");
  },
});
