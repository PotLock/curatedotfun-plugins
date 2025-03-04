import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Redis } from "@upstash/redis";
import { cors } from "hono/cors";
import jwt from "jsonwebtoken";
import { Feed } from "feed";

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

interface FeedConfig {
  id: string;
  title: string;
  maxItems: number;
  description?: string;
  link?: string;
  language?: string;
  copyright?: string;
  favicon?: string;
}

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
  if (c.req.path === '/' || (c.req.method === 'GET' && c.req.path.startsWith('/feeds/'))) {
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

// Health check
app.get("/", (c) => c.text("RSS Service is running"));

// Create a new feed
app.post("/feeds", async (c) => {
  const { id, title, maxItems = 100, description, link, language, copyright, favicon } = await c.req.json<FeedConfig>();
  
  if (!id || !title) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const feedConfig: FeedConfig = { 
    id, 
    title, 
    maxItems,
    description,
    link,
    language,
    copyright,
    favicon
  };
  
  await redis.set(`feed:${id}`, JSON.stringify(feedConfig));
  
  return c.json({ message: "Feed created successfully", feed: feedConfig });
});

// Add item to feed
app.post("/feeds/:id/items", async (c) => {
  const feedId = c.req.param("id");
  const item = await c.req.json<RssItem>();
  
  const feed = await redis.get<string>(`feed:${feedId}`);
  if (!feed) {
    return c.json({ error: "Feed not found" }, 404);
  }

  // Add item to feed's items list
  await redis.lpush(`feed:${feedId}:items`, JSON.stringify(item));
  
  // Trim to max items
  const { maxItems = 100 } = JSON.parse(feed);
  await redis.ltrim(`feed:${feedId}:items`, 0, maxItems - 1);
  
  return c.json({ message: "Item added successfully", item });
});

// Get feed as RSS
app.get("/feeds/:id", async (c) => {
  const feedId = c.req.param("id");
  
  const feedData = await redis.get<string>(`feed:${feedId}`);
  if (!feedData) {
    return c.json({ error: "Feed not found" }, 404);
  }

  const feedConfig = JSON.parse(feedData) as FeedConfig;
  const items = await redis.lrange<string[]>(`feed:${feedId}:items`, 0, -1);
  
  // Create a new Feed instance
  const feed = new Feed({
    title: feedConfig.title,
    description: feedConfig.description || `RSS feed for ${feedConfig.title}`,
    id: c.req.url,
    link: feedConfig.link || c.req.url,
    language: feedConfig.language || "en",
    favicon: feedConfig.favicon,
    copyright: feedConfig.copyright,
    updated: new Date(),
    generator: "CuratedFun RSS Service"
  });

  // Add items to the feed
  items.forEach(itemJson => {
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

  // Generate RSS 2.0 feed
  const rss = feed.rss2();

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
});

// Start server if not in production (Vercel will handle this in prod)
if (process.env.NODE_ENV !== "production") {
  serve({
    fetch: app.fetch,
    port: 3001,
  });
  console.log("RSS Service running at http://localhost:3001");
}
