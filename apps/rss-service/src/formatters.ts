import { Feed, Item } from "feed";
import { ApiFormat, FeedFormat, RssItem } from "./types.js";
import { feedConfig } from "./config.js";
import { stripHtml } from "./utils.js";

/**
 * Format items based on the requested format, following the feed package's Item interface
 */
export function formatItems(items: string[], format: ApiFormat = 'raw'): Item[] {
  if (format === 'raw') {
    // Return items with HTML content stripped
    return items.map(itemJson => {
      const item = JSON.parse(itemJson) as RssItem;
      return {
        title: stripHtml(item.title || "Untitled"),
        id: item.guid,
        link: item.link,
        date: new Date(item.publishedAt),
        description: stripHtml(item.content),
        content: stripHtml(item.content),
        guid: item.guid,
        author: item.author ? [{ name: item.author }] : undefined,
        category: item.categories?.map(cat => ({ name: cat })),
        published: new Date(item.publishedAt),
        enclosure: item.enclosure ? {
          url: item.enclosure.url,
          length: item.enclosure.length,
          type: item.enclosure.type
        } : undefined
      };
    });
  } else { // format === 'html'
    // Return items with HTML content preserved
    return items.map(itemJson => {
      const item = JSON.parse(itemJson) as RssItem;
      return {
        title: item.title || "Untitled",
        id: item.guid,
        link: item.link,
        date: new Date(item.publishedAt),
        description: item.content,
        content: item.content,
        guid: item.guid,
        author: item.author ? [{ name: item.author }] : undefined,
        category: item.categories?.map(cat => ({ name: cat })),
        published: new Date(item.publishedAt),
        enclosure: item.enclosure ? {
          url: item.enclosure.url,
          length: item.enclosure.length,
          type: item.enclosure.type
        } : undefined
      };
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

    const rawFeed = {
      version: "https://jsonfeed.org/version/1.1",
      title: feedConfig.feed.title,
      description: feedConfig.feed.description,
      home_page_url: feedConfig.feed.siteUrl,
      feed_url: `${feedConfig.feed.siteUrl}/raw.json`,
      authors: feedConfig.feed.author ? [
        {
          name: feedConfig.feed.author.name,
          url: feedConfig.feed.author.link,
          avatar: feedConfig.customization?.image
        }
      ] : undefined,
      language: feedConfig.feed.language,
      favicon: feedConfig.feed.favicon,
      items: rawItems
    };

    return {
      content: JSON.stringify(rawFeed, null, 2),
      contentType: 'application/json; charset=utf-8'
    };
  }

  // Create a new Feed instance for standard formats
  const feed = new Feed({
    title: feedConfig.feed.title,
    description: feedConfig.feed.description,
    id: feedConfig.feed.siteUrl,
    link: feedConfig.feed.siteUrl,
    language: feedConfig.feed.language || "en",
    favicon: feedConfig.feed.favicon,
    copyright: feedConfig.feed.copyright || `© ${new Date().getFullYear()}`,
    updated: new Date(),
    generator: "curate.fun RSS Service",
    feedLinks: {
      rss: `${feedConfig.feed.siteUrl}/rss.xml`,
      atom: `${feedConfig.feed.siteUrl}/atom.xml`,
      json: `${feedConfig.feed.siteUrl}/feed.json`
    }
  });


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
      image: item.enclosure?.type?.startsWith('image/') ? item.enclosure.url : '',
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
