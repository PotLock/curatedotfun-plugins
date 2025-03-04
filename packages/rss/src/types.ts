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
export interface RssConfig {
  // Required feed properties
  feedId: string;                // Unique identifier for the feed
  title: string;                 // Title of the feed
  
  // Service configuration
  serviceUrl: string;            // URL of the RSS service
  jwtToken?: string;             // JWT token for authentication
  
  // Optional feed properties
  maxItems?: string;             // Maximum number of items to keep in the feed (default: 100)
  description?: string;          // Description of the feed
  link?: string;                 // URL of the website corresponding to the feed
  language?: string;             // Language of the feed (e.g., 'en-us')
  copyright?: string;            // Copyright notice
  favicon?: string;              // URL to the feed's favicon
}
