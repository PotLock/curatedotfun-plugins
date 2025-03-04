// Format types supported by the service
export type FeedFormat = 'rss' | 'atom' | 'json' | 'raw';
export type ApiFormat = 'raw' | 'html';

export interface RssItem {
  // Core elements
  title?: string;
  content: string;
  link: string;
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

export interface FeedConfig {
  feed: {
    title: string;
    description: string;
    siteUrl: string;
    language: string;
    copyright?: string;
    favicon?: string;
    author?: {
      name: string;
      email?: string;
      link?: string;
    };
    preferredFormat?: FeedFormat;
    maxItems: number;
  };
  customization?: {
    categories?: string[];
    image?: string;
  };
}
