import { Context } from "hono";
import { feedConfig } from "./config.js";
import { formatItems, generateFeed } from "./formatters.js";
import { addItem, getItems } from "./storage.js";
import { ApiFormat, RssItem } from "./types.js";
import { sanitizeContent } from "./utils.js";

/**
 * Health check and redirect to preferred format
 */
export async function handleRoot(c: Context): Promise<Response> {
  const preferredFormat = feedConfig.feed.preferredFormat || 'rss';
  const formatExtension = preferredFormat === 'json' ? 'json' : `${preferredFormat}.xml`;
  return c.redirect(`/${formatExtension}`);
}

/**
 * Handle RSS format request
 */
export async function handleRss(c: Context): Promise<Response> {
  const { content, contentType } = generateFeed(await getItems(), 'rss');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
}

/**
 * Handle Atom format request
 */
export async function handleAtom(c: Context): Promise<Response> {
  const { content, contentType } = generateFeed(await getItems(), 'atom');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
}

/**
 * Handle JSON Feed format request (includes HTML)
 */
export async function handleJsonFeed(c: Context): Promise<Response> {
  const { content, contentType } = generateFeed(await getItems(), 'json');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
}

/**
 * Handle Raw JSON format request
 */
export async function handleRawJson(c: Context): Promise<Response> {
  const { content, contentType } = generateFeed(await getItems(), 'raw');
  return new Response(content, {
    headers: { "Content-Type": contentType }
  });
}

/**
 * Get all items with format options
 */
export async function handleGetItems(c: Context): Promise<Response> {
  const format = c.req.query('format') as ApiFormat || 'raw';
  const items = await getItems();
  
  if (format === 'raw' || format === 'html') {
    const formattedItems = formatItems(items, format);
    return c.json(formattedItems);
  } else {
    // Invalid format
    return c.json({ 
      error: `Invalid format: ${format}. Valid formats are: raw, html`,
      message: "Format determines how item content is returned: raw (HTML stripped) or html (HTML preserved)"
    }, 400);
  }
}

/**
 * Add item to feed
 */
export async function handleAddItem(c: Context): Promise<Response> {
  const item = await c.req.json<RssItem>();
  
  // Validate required fields
  if (!item.content) {
    return c.json({ 
      error: "Missing required field: content",
      message: "The content field is required for RSS items"
    }, 400);
  }
  
  if (!item.link) {
    return c.json({ 
      error: "Missing required field: link",
      message: "The link field is required for RSS items"
    }, 400);
  }
  
  // Sanitize HTML content
  const sanitizedContent = sanitizeContent(item.content);
  
  // Ensure required fields have values
  const completeItem: RssItem = {
    // Required fields with defaults if not provided
    content: sanitizedContent,
    publishedAt: item.publishedAt || new Date().toISOString(),
    guid: item.guid || `item-${Date.now()}`,
    link: item.link,
    
    // Optional fields with defaults
    title: item.title || "New Update",
    
    // Optional fields that are passed through if present
    ...(item.author && { author: item.author }),
    ...(item.categories && { categories: item.categories }),
    ...(item.comments && { comments: item.comments }),
    ...(item.enclosure && { enclosure: item.enclosure }),
    ...(item.source && { source: item.source }),
    ...(item.isPermaLink !== undefined && { isPermaLink: item.isPermaLink })
  };

  // Add item to feed's items list
  await addItem(completeItem);
  
  return c.json({ 
    message: "Item added successfully", 
    item: completeItem 
  });
}
