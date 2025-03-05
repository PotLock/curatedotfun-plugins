import { Feed, Item } from "feed";
import { feedConfig } from "./config.js";
import { ApiFormat, FeedFormat, RssItem } from "./types.js";
import { stripHtml } from "./utils.js";

/**
 * Format items based on the requested format, following the feed package's Item interface
 */
export function formatItems(items: string[], format: ApiFormat = 'raw'): Item[] {
  if (format === 'raw') {
    // Return items with HTML content stripped
    return items.map(itemJson => {
      const parsedItem = JSON.parse(itemJson);
      // Ensure date fields are Date objects
      const item: RssItem = {
        ...parsedItem,
        date: parsedItem.date ? new Date(parsedItem.date) : new Date(),
        published: parsedItem.published ? new Date(parsedItem.published) : undefined,
        title: stripHtml(parsedItem.title),
        description: stripHtml(parsedItem.description || ""),
        content: stripHtml(parsedItem.content!),
      };
      return item;
    });
  } else { // format === 'html'
    // Return items with HTML content preserved
    return items.map(itemJson => {
      const parsedItem = JSON.parse(itemJson);
      // Ensure date fields are Date objects
      const item: RssItem = {
        ...parsedItem,
        date: parsedItem.date ? new Date(parsedItem.date) : new Date(),
        published: parsedItem.published ? new Date(parsedItem.published) : undefined
      };
      return item;
    });
  }
}

/**
 * Generate feed in different formats
 */
export function generateFeed(items: string[], format: FeedFormat = 'rss'): { content: string, contentType: string } {

  // For raw format, return JSON with no HTML
  if (format === 'raw') {
    const rawItems = formatItems(items, 'raw');

    const jsonFeed = {
      version: "https://jsonfeed.org/version/1.1",
      feed_url: `${feedConfig.siteUrl}/raw.json`,
      items: rawItems
    };

    return {
      content: JSON.stringify(jsonFeed, null, 2),
      contentType: 'application/json; charset=utf-8'
    };
  }

  // Create a new Feed instance for standard formats
  const feed = new Feed({
    id: feedConfig.id,
    title: feedConfig.title,
    description: feedConfig.description,
    link: feedConfig.siteUrl,
    language: feedConfig.language || "en",
    favicon: feedConfig.favicon,
    copyright: feedConfig.copyright || `© ${new Date().getFullYear()}`,
    updated: new Date(),
    generator: "curate.fun RSS Service",
    feedLinks: {
      rss: `${feedConfig.siteUrl}/rss.xml`,
      atom: `${feedConfig.siteUrl}/atom.xml`,
      json: `${feedConfig.siteUrl}/feed.json`
    }
  });


  // Add items to the feed
  items.forEach((itemJson: string) => {
    const parsedItem = JSON.parse(itemJson);
    // Ensure date fields are Date objects
    const item: RssItem = {
      ...parsedItem,
      date: parsedItem.date ? new Date(parsedItem.date) : new Date(),
      published: parsedItem.published ? new Date(parsedItem.published) : undefined
    };
    feed.addItem(item);
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
