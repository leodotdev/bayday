/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as availability from "../availability.js";
import type * as boats from "../boats.js";
import type * as bookings from "../bookings.js";
import type * as conversations from "../conversations.js";
import type * as dedup from "../dedup.js";
import type * as email from "../email.js";
import type * as favorites from "../favorites.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as listings from "../listings.js";
import type * as messages from "../messages.js";
import type * as participants from "../participants.js";
import type * as reviews from "../reviews.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedMyChats from "../seedMyChats.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  availability: typeof availability;
  boats: typeof boats;
  bookings: typeof bookings;
  conversations: typeof conversations;
  dedup: typeof dedup;
  email: typeof email;
  favorites: typeof favorites;
  helpers: typeof helpers;
  http: typeof http;
  listings: typeof listings;
  messages: typeof messages;
  participants: typeof participants;
  reviews: typeof reviews;
  search: typeof search;
  seed: typeof seed;
  seedMyChats: typeof seedMyChats;
  storage: typeof storage;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
