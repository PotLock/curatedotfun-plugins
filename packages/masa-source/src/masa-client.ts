import type { SourceItem } from "@curatedotfun/types";

export interface MasaSearchResult extends SourceItem {
  ID: string;
  ExternalID: string;
  Content: string;
  Metadata: {
    author?: string;
    user_id?: string;
    created_at?: string;
    conversation_id?: string;
    IsReply?: boolean;
    InReplyToStatusID?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MasaApiSearchOptions {
  query: string;
  maxResults?: number;
  sinceDate?: string;
}

export interface MasaClientConfig {
  apiKey: string;
  baseUrl?: string; // Optional, with a default
}

/**
 * Client for interacting with the Masa API for social media scraping.
 */
export class MasaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MasaClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://data.masa.ai/api/v1";
    console.log("using the baseUrl", this.baseUrl);

    if (!this.apiKey) {
      // This should ideally be caught by config validation in the plugin
      console.warn(
        "Masa API key was not provided to MasaClient. API calls will fail.",
      );
    }
  }

  /**
   * Submit a search job to the Masa API.
   * @param searchType The type of scraper, e.g., "twitter-scraper".
   * @param query The search query.
   * @param maxResults Maximum number of results to return.
   * @returns Promise resolving to the UUID of the search job, or null on error.
   */
  public async submitSearchJob(
    searchType: string,
    query: string,
    maxResults: number,
  ): Promise<string | null> {
    const url = `${this.baseUrl}/search/live/${searchType.replace("-scraper", "")}`;

    const payload = {
      type: searchType,
      arguments: {
        query: query,
        max_results: maxResults,
      },
    };

    console.log(
      "MasaClient: Submitting Masa search job with payload:",
      JSON.stringify(payload),
      "to URL:",
      url,
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `MasaClient: Error submitting Masa search job: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(`Masa API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error(
          "MasaClient: Masa API returned an error on job submission:",
          data.error,
        );
        return null;
      }

      console.log("MasaClient: Masa search job submitted, UUID:", data.uuid);
      return data.uuid;
    } catch (error) {
      console.error("MasaClient: Failed to submit Masa search job:", error);
      return null;
    }
  }

  /**
   * Check the status of a Masa search job.
   * @param searchType The type of scraper used for the job.
   * @param uuid The UUID of the search job.
   * @returns Promise resolving to the status of the job.
   */
  public async checkJobStatus(
    searchType: string,
    uuid: string,
  ): Promise<string | null> {
    const url = `${this.baseUrl}/search/live/${searchType.replace("-scraper", "")}/status/${uuid}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `MasaClient: Error checking Masa job status: ${response.status} ${response.statusText}`,
          errorText,
        );
        return "error(fetching_status)";
      }

      const data = await response.json();
      if (
        data.error &&
        data.status !== "error" &&
        data.status !== "error(retrying)"
      ) {
        console.warn(
          "MasaClient: Masa API returned an error message with non-error status:",
          data.error,
        );
      }

      console.log(`MasaClient: Masa job status for ${uuid}: ${data.status}`);
      return data.status;
    } catch (error) {
      console.error("MasaClient: Failed to check Masa job status:", error);
      return "error(fetching_status)";
    }
  }

  /**
   * Retrieve the results of a completed Masa search job.
   * @param searchType The type of scraper used for the job.
   * @param uuid The UUID of the search job.
   * @returns Promise resolving to an array of search results, or null on error.
   */
  public async getJobResults(
    searchType: string,
    uuid: string,
  ): Promise<MasaSearchResult[] | null> {
    const url = `${this.baseUrl}/search/live/${searchType.replace("-scraper", "")}/result/${uuid}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `MasaClient: Error retrieving Masa job results: ${response.status} ${response.statusText}`,
          errorText,
        );
        return null;
      }

      const data = await response.json();
      console.log(
        `MasaClient: Retrieved ${data?.length || 0} results for Masa job ${uuid}`,
      );
      return data;
    } catch (error) {
      console.error("MasaClient: Failed to retrieve Masa job results:", error);
      return null;
    }
  }
}
