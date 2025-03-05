/**
 * RSS Feed plugin configuration
 */
export interface RssConfig extends Record<string, unknown> {
  // Service configuration
  serviceUrl: string; // URL of the RSS service
  apiSecret: string; // API secret for authentication
}
