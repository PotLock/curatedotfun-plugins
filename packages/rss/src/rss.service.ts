import { RssItem, RssConfig } from "./types";

export class RssService {
  private serviceUrl?: string;
  private jwtToken?: string;
  private description?: string;
  private link?: string;
  private language?: string;
  private copyright?: string;
  private favicon?: string;

  constructor(
    private feedId: string,
    private title: string,
    private maxItems: number = 100,
    config?: Partial<RssConfig>,
  ) {
    if (config) {
      this.serviceUrl = config.serviceUrl;
      this.jwtToken = config.jwtToken;
      this.description = config.description;
      this.link = config.link;
      this.language = config.language;
      this.copyright = config.copyright;
      this.favicon = config.favicon;
    }
  }

  async initialize(): Promise<void> {
    // If service URL is provided, create the feed on the service
    if (this.serviceUrl) {
      try {
        // Check if feed exists first
        const checkResponse = await fetch(`${this.serviceUrl}/feeds/${this.feedId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // If feed doesn't exist, create it
        if (!checkResponse.ok) {
          const createResponse = await fetch(`${this.serviceUrl}/feeds`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.jwtToken ? { 'Authorization': `Bearer ${this.jwtToken}` } : {})
            },
            body: JSON.stringify({
              id: this.feedId,
              title: this.title,
              maxItems: this.maxItems,
              description: this.description,
              link: this.link,
              language: this.language,
              copyright: this.copyright,
              favicon: this.favicon
            })
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(`Failed to create feed on RSS service: ${errorData.error || createResponse.statusText}`);
          }
        }
      } catch (error) {
        console.error('Error initializing feed on RSS service:', error);
        throw new Error(`Failed to initialize RSS feed: ${error}`);
      }
    } else {
      throw new Error('RSS service URL is required');
    }
  }

  async saveItem(item: RssItem): Promise<void> {
    if (!this.serviceUrl) {
      throw new Error('RSS service URL is required');
    }

    const response = await fetch(`${this.serviceUrl}/feeds/${this.feedId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.jwtToken ? { 'Authorization': `Bearer ${this.jwtToken}` } : {})
      },
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to save item to RSS service: ${errorData.error || response.statusText}`);
    }
  }

  async getItems(limit?: number): Promise<RssItem[]> {
    if (!this.serviceUrl) {
      throw new Error('RSS service URL is required');
    }

    const response = await fetch(`${this.serviceUrl}/feeds/${this.feedId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch items from RSS service: ${response.statusText}`);
    }

    // Parse the RSS XML to extract items
    const xmlText = await response.text();
    return this.parseRssXml(xmlText, limit || this.maxItems);
  }

  private parseRssXml(xmlText: string, limit: number): RssItem[] {
    const items: RssItem[] = [];
    
    try {
      // In browser environments
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const itemElements = xmlDoc.getElementsByTagName("item");
        const count = Math.min(itemElements.length, limit);
        
        for (let i = 0; i < count; i++) {
          const itemElement = itemElements[i];
          const item = this.parseItemElement(itemElement);
          if (item) {
            items.push(item);
          }
        }
      } 
      // In Node.js environments, we would need to use a XML parser library
      else {
        console.warn('DOMParser not available in this environment. XML parsing not supported.');
      }
    } catch (error) {
      console.error('Error parsing RSS XML:', error);
    }
    
    return items;
  }

  private parseItemElement(itemElement: Element): RssItem | null {
    const title = this.getElementTextContent(itemElement, "title");
    const content = this.getElementTextContent(itemElement, "description");
    const link = this.getElementTextContent(itemElement, "link");
    const publishedAt = this.getElementTextContent(itemElement, "pubDate");
    const guid = this.getElementTextContent(itemElement, "guid");
    const author = this.getElementTextContent(itemElement, "author");
    const comments = this.getElementTextContent(itemElement, "comments");
    
    // Parse categories
    const categoryElements = itemElement.getElementsByTagName("category");
    const categories: string[] = [];
    for (let i = 0; i < categoryElements.length; i++) {
      const category = categoryElements[i].textContent;
      if (category) {
        categories.push(category);
      }
    }
    
    // Parse enclosure
    const enclosureElement = itemElement.getElementsByTagName("enclosure")[0];
    let enclosure: RssItem['enclosure'] | undefined;
    if (enclosureElement) {
      const url = enclosureElement.getAttribute("url");
      const lengthStr = enclosureElement.getAttribute("length");
      const type = enclosureElement.getAttribute("type");
      
      if (url && lengthStr && type) {
        enclosure = {
          url,
          length: parseInt(lengthStr, 10),
          type
        };
      }
    }
    
    // Parse source
    const sourceElement = itemElement.getElementsByTagName("source")[0];
    let source: RssItem['source'] | undefined;
    if (sourceElement) {
      const url = sourceElement.getAttribute("url");
      const title = sourceElement.textContent;
      
      if (url && title) {
        source = { url, title };
      }
    }
    
    // Check if guid is permalink
    const guidElement = itemElement.getElementsByTagName("guid")[0];
    let isPermaLink: boolean | undefined;
    if (guidElement) {
      const isPermaLinkAttr = guidElement.getAttribute("isPermaLink");
      if (isPermaLinkAttr !== null) {
        isPermaLink = isPermaLinkAttr.toLowerCase() !== "false";
      }
    }
    
    if (content && guid) {
      return {
        title,
        content,
        link,
        publishedAt: publishedAt || new Date().toISOString(),
        guid,
        author,
        categories: categories.length > 0 ? categories : undefined,
        comments,
        enclosure,
        source,
        isPermaLink
      };
    }
    
    return null;
  }

  private getElementTextContent(parent: Element, tagName: string): string | undefined {
    const element = parent.getElementsByTagName(tagName)[0];
    return element ? element.textContent || undefined : undefined;
  }

  getTitle(): string {
    return this.title;
  }

  getPath(): string | undefined {
    return this.path;
  }

  getMaxItems(): number {
    return this.maxItems;
  }

  getServiceUrl(): string | undefined {
    return this.serviceUrl;
  }

  getJwtToken(): string | undefined {
    return this.jwtToken;
  }
}
