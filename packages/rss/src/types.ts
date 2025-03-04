import { Author, Category, Enclosure } from 'feed/lib/typings/index.js';
/**
 * RSS Item interface representing an entry in an RSS feed
 */
export interface RssItem {
  // Core elements
  title?: string;
  content: string;
  link: string;
  publishedAt: string;
  guid: string;
  
  // Additional elements
  author?: Author[];
  category?: Category[];
  image?: string | Enclosure;
  audio?: string | Enclosure;
  video?: string | Enclosure;
  enclosure?: Enclosure;
  source?: {
    url: string;
    title: string;
  };
  isPermaLink?: boolean;
}

/**
 * RSS Feed configuration
 */
export interface RssConfig extends Record<string, unknown> {
  // Service configuration
  serviceUrl: string;            // URL of the RSS service
  apiSecret: string;             // API secret for authentication
}
