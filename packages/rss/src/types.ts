/**
 * RSS Item interface representing an entry in an RSS feed
 */
export interface RssItem {
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

/**
 * RSS Feed configuration
 */
export interface RssConfig extends Record<string, unknown> {
  // Service configuration
  serviceUrl: string;            // URL of the RSS service
  jwtToken?: string;             // JWT token for authentication
}
