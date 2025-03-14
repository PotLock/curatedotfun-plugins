/**
 * RSS Feed plugin configuration
 */
export interface RssConfig extends Record<string, unknown> {
  // Service configuration
  serviceUrl: string; // URL of the RSS service
  apiSecret: string; // API secret for authentication

  // Optional feed configuration
  feedConfig?: {
    title: string;
    description: string;
    siteUrl: string;
    language?: string;
    copyright?: string;
    image?: string;
    favicon?: string;
    author?: {
      name: string;
      email?: string;
      link?: string;
    };
    maxItems?: number;
  };
}
