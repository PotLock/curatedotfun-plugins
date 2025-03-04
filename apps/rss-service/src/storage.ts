import { Redis } from "@upstash/redis";
import { DEFAULT_FEED_ID, feedConfig } from "./config.js";
import { RssItem } from "./types.js";

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Get all items from the feed
 */
export async function getItems(): Promise<string[]> {
  return await redis.lrange(
    `feed:${DEFAULT_FEED_ID}:items`, 
    0, 
    feedConfig.feed.maxItems - 1
  );
}

/**
 * Add an item to the feed
 */
export async function addItem(item: RssItem): Promise<void> {
  // Add item to feed's items list
  await redis.lpush(`feed:${DEFAULT_FEED_ID}:items`, JSON.stringify(item));
  
  // Trim to max items
  await redis.ltrim(
    `feed:${DEFAULT_FEED_ID}:items`, 
    0, 
    feedConfig.feed.maxItems - 1
  );
}

/**
 * Initialize feed in Redis if it doesn't exist
 */
export async function initializeFeed(): Promise<void> {
  const exists = await redis.exists(`feed:${DEFAULT_FEED_ID}`);
  if (!exists) {
    console.log(`Initializing feed: ${DEFAULT_FEED_ID}`);
    await redis.set(`feed:${DEFAULT_FEED_ID}`, JSON.stringify({
      id: DEFAULT_FEED_ID,
      ...feedConfig.feed
    }));
  }
}
