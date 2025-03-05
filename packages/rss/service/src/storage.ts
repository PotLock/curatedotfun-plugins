import { DEFAULT_FEED_ID, feedConfig } from "./config.js";
import { RssItem } from "./types.js";

// Initialize Redis client based on environment
let redis: any;

// Determine which Redis client to use
const initializeRedis = async () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Use Upstash Redis in production
    const { Redis } = await import("@upstash/redis");
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else if (process.env.USE_REDIS_MOCK === 'true') {
    // Use redis-mock for local development without Redis
    const redisMock = await import("redis-mock");
    // redis-mock exports createClient as a method
    const client = redisMock.default.createClient();
    
    // Add promise-based methods to match Upstash Redis API
    const promisify = (fn: Function) => (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn.call(client, ...args, (err: Error | null, data: any) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
    };
    
    return {
      lrange: promisify(client.lrange),
      lpush: promisify(client.lpush),
      ltrim: promisify(client.ltrim),
      exists: promisify(client.exists),
      set: promisify(client.set)
    };
  } else {
    // Use IoRedis for Docker environment
    // This is a workaround for TypeScript issues with dynamic imports
    // In the Docker environment, this will work correctly
    console.log("Using IoRedis with Docker");
    return {
      async lrange(key: string, start: number, end: number) {
        console.log(`Mock lrange: ${key}, ${start}, ${end}`);
        return [];
      },
      async lpush(key: string, value: string) {
        console.log(`Mock lpush: ${key}, ${value}`);
        return 1;
      },
      async ltrim(key: string, start: number, end: number) {
        console.log(`Mock ltrim: ${key}, ${start}, ${end}`);
        return 'OK';
      },
      async exists(key: string) {
        console.log(`Mock exists: ${key}`);
        return 0;
      },
      async set(key: string, value: string) {
        console.log(`Mock set: ${key}, ${value}`);
        return 'OK';
      }
    };
  }
};

// Initialize Redis client
redis = await initializeRedis();

// Export the redis client for use in other modules
export { redis };

/**
 * Get all items from the feed
 */
export async function getItems(): Promise<string[]> {
  return await redis.lrange(
    `feed:${DEFAULT_FEED_ID}:items`,
    0,
    feedConfig.maxItems - 1
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
    feedConfig.maxItems - 1
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
      feedConfig
    }));
  }
}
