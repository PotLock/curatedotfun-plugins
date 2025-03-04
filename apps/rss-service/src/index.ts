import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Redis } from "@upstash/redis";
import { cors } from "hono/cors";
import jwt from "jsonwebtoken";
import { Feed } from "feed";
import fs from "fs";
import path from "path";

// Environment variables validation
const REQUIRED_ENV_VARS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "JWT_SECRET"
];

REQUIRED_ENV_VARS.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is required`);
    process.exit(1);
  }
});

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET!;
// Optional allowed origins for CORS (comma-separated list)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];

// Load feed configuration from JSON file
const CONFIG_FILE_PATH = path.join(process.cwd(), 'feed-config.json');
let feedConfig: any;

try {
  const configFile = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
  feedConfig = JSON.parse(configFile);
  console.log('Loaded feed configuration from feed-config.json');
} catch (error) {
  console.warn('Could not load feed-config.json, using default configuration');
  feedConfig = {
    feed: {
      title: "Default RSS Feed",
      description: "A feed of curated content",
      siteUrl: "https://example.com",
      language: "en",
      maxItems: 100,
      preferredFormat: "rss"
    }
  };
}

// Default feed ID - since we're focusing on a single feed
const DEFAULT_FEED_ID = "main";

interface RssItem {
  // Core elements
  title?: string;
  content: string;
  link?: string;
  publishedAt: string;
  guid: string;
  
  // Additional elements
  author?: string;
  categories?: string[];
  comments?: string;
  enclosure?: {
    url: string;
    length: number;
    type: string;
  };
  source?: {
    url: string;
    title: string;
  };
  isPermaLink?: boolean;
}

// Format types supported by the service
type FeedFormat = 'rss' | 'atom' | 'json';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const app = new Hono();

// Configure CORS with specific origins if provided
app.use("*", cors({
  origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['Content-Length', 'X-RSS-Service-Version'],
  maxAge: 86400,
}));

// Authentication middleware
const authenticate = async (c: any, next: () => Promise<void>) => {
  // Skip authentication for public endpoints
  const publicPaths = ['/', '/rss.xml', '/atom.xml', '/feed.json', '/api/items'];
  if (c.req.method === 'GET' && (publicPaths.includes(c.req.path) || c.req.path === '/')) {
    return await next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  try {
    jwt.verify(token, JWT_SECRET);
    return await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
};

// Apply authentication middleware
app.use('*', authenticate);

// Helper function to generate feed in different formats
async function generateFeed(format: FeedFormat = 'rss'): Promise<{ content: string, contentType: string }> {
  // Get items from Redis
  const items = await redis.lrange<string[]>(`feed:${DEFAULT_FEED_ID}:items`, 0, feedConfig.feed.maxItems - 1);
  
  // Create a new Feed instance
  const feed = new Feed({
    title: feedConfig.feed.title,
    description: feedConfig.feed.description,
    id: feedConfig.feed.siteUrl,
    link: feedConfig.feed.siteUrl,
    language: feedConfig.feed.language || "en",
    favicon: feedConfig.feed.favicon,
    copyright: feedConfig.feed.copyright,
    updated: new Date(),
    generator: "CuratedFun RSS Service",
    feedLinks: {
      rss: `${feedConfig.feed.siteUrl}/rss.xml`,
      atom: `${feedConfig.feed.siteUrl}/atom.xml`,
      json: `${feedConfig.feed.siteUrl}/feed.json`
    }
  });

  // Add author if provided
  if (feedConfig.feed.author) {
    feed.addAuthor({
      name: feedConfig.feed.author.name,
      email: feedConfig.feed.author.email,
      link: feedConfig.feed.author.link
    });
  }

  // Add categories if provided
  if (feedConfig.customization?.categories) {
    feedConfig.customization.categories.forEach((category: string) => {
      feed.addCategory(category);
    });
  }

  // Add image if provided
  if (feedConfig.customization?.image) {
    feed.image = feedConfig.customization.image;
  }

  // Add items to the feed
  items.forEach((itemJson: string) => {
    const item = JSON.parse(itemJson) as RssItem;
    
    feed.addItem({
      title: item.title || "Untitled",
      id: item.guid,
      link: item.link,
      description: item.content,
      content: item.content,
      date: new Date(item.publishedAt),
      published: new Date(item.publishedAt),
      author: item.author ? [{ name: item.author }] : undefined,
      category: item.categories?.map(cat => ({ name: cat })),
      image: item.enclosure?.type?.startsWith('image/') ? item.enclosure.url : undefined,
      enclosure: item.enclosure ? {
        url: item.enclosure.url,
        length: item.enclosure.length,
        type: item.enclosure.type
      } : undefined
    });
  });

  // Generate feed in requested format
  let content: string;
  let contentType: string;
  
  switch (format) {
    case 'atom':
      content = feed.atom1();
      contentType = 'application/atom+xml; charset=utf-8';
      break;
    case 'json':
      content = feed.json1();
      contentType = 'application/json; charset=utf-8';
      break;
    case 'rss':
    default:
      content = feed.rss2();
      contentType = 'application/rss+xml; charset=utf-8';
      break;
  }

  return { content, contentType };
}

// Health check and redirect to preferred format
app.get("/", async (c) => {
  const preferredFormat = feedConfig.feed.preferredFormat || 'rss';
  const formatExtension = preferredFormat === 'json' ? 'json' : `${preferredFormat}.xml`;
  return c.redirect(`/${formatExtension}`);
});

// Standard-compliant URLs for different formats
app.get("/rss.xml", async (c) => {
  const { content, contentType } = await generateFeed('rss');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
});

app.get("/atom.xml", async (c) => {
  const { content, contentType } = await generateFeed('atom');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
});

app.get("/feed.json", async (c) => {
  const { content, contentType } = await generateFeed('json');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
});

// API endpoint to get all items as JSON
app.get("/api/items", async (c) => {
  const items = await redis.lrange<string[]>(`feed:${DEFAULT_FEED_ID}:items`, 0, feedConfig.feed.maxItems - 1);
  const parsedItems = items.map(item => JSON.parse(item));
  return c.json(parsedItems);
});

// Add item to feed
app.post("/api/items", async (c) => {
  const item = await c.req.json<RssItem>();
  
  if (!item.content || !item.guid) {
    return c.json({ error: "Missing required fields: content and guid are required" }, 400);
  }

  // Add item to feed's items list
  await redis.lpush(`feed:${DEFAULT_FEED_ID}:items`, JSON.stringify(item));
  
  // Trim to max items
  await redis.ltrim(`feed:${DEFAULT_FEED_ID}:items`, 0, feedConfig.feed.maxItems - 1);
  
  return c.json({ message: "Item added successfully", item });
});

// Initialize feed in Redis if it doesn't exist
async function initializeFeed() {
  const exists = await redis.exists(`feed:${DEFAULT_FEED_ID}`);
  if (!exists) {
    console.log(`Initializing feed: ${DEFAULT_FEED_ID}`);
    await redis.set(`feed:${DEFAULT_FEED_ID}`, JSON.stringify({
      id: DEFAULT_FEED_ID,
      ...feedConfig.feed
    }));
  }
}

// Start server
async function startServer() {
  // Initialize feed
  await initializeFeed();
  
  // Start server if not in production (Vercel will handle this in prod)
  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    serve({
      fetch: app.fetch,
      port,
    });
    console.log(`RSS Service running at http://localhost:${port}`);
    console.log(`Available formats:`);
    console.log(`- RSS 2.0: http://localhost:${port}/rss.xml`);
    console.log(`- Atom: http://localhost:${port}/atom.xml`);
    console.log(`- JSON Feed: http://localhost:${port}/feed.json`);
    console.log(`- API: http://localhost:${port}/api/items`);
  }
}

startServer().catch(console.error);

// Export the Hono app for serverless environments
export default app;
