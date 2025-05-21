import {
  IPlatformSearchService,
  LastProcessedState,
  MasaJobProgress,
  // PlatformState, // Not used directly here, TwitterPlatformState extends it
} from "@curatedotfun/types";
// Removed import of UtilTweet from @curatedotfun/utils as it's not exported there.
// ServiceTweet is already an alias for MasaSearchResult.
import {
  MasaApiSearchOptions,
  MasaClient,
  MasaSearchResult,
} from "../../masa-client";
import {
  TwitterQueryOptionsOutput,
  TwitterPlatformState, // This now extends PlatformState
} from "./types";
import { buildTwitterQuery } from "./utils/twitterQueryBuilder";

// For now, the service will work with MasaSearchResult and transform it.
// If UtilTweet is different, the transformation logic will need to be robust.
export type ServiceTweet = MasaSearchResult; // Internally, service deals with what MasaClient returns

// const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - Cache logic to be re-added later
const DEFAULT_PAGE_SIZE = 25;

export class TwitterSearchService
  implements
    IPlatformSearchService<
      ServiceTweet,
      TwitterQueryOptionsOutput,
      TwitterPlatformState
    >
{
  private masaClient: MasaClient;
  // private searchCache: Map<string, any>; // Cache logic to be re-added later
  // private cacheTtl: number;
  // private processedTweetIdsThisSession: Set<string>; // To be re-evaluated

  constructor(
    masaClient: MasaClient /*, cacheTtlMs: number = DEFAULT_CACHE_TTL_MS */,
  ) {
    this.masaClient = masaClient;
    // this.searchCache = new Map();
    // this.cacheTtl = cacheTtlMs;
    // this.processedTweetIdsThisSession = new Set();
  }

  async initialize(): Promise<void> {
    console.log("TwitterSearchService initialized.");
  }

  async search(
    platformOptions: TwitterQueryOptionsOutput,
    currentState: LastProcessedState<TwitterPlatformState> | null,
  ): Promise<{
    items: ServiceTweet[];
    nextStateData: TwitterPlatformState | null;
  }> {
    console.log(
      "TwitterSearchService: search called with options:",
      platformOptions,
    );
    if (currentState) {
      console.log(
        "TwitterSearchService: current state:",
        JSON.stringify(currentState, null, 2),
      );
    }

    const currentJob = currentState?.data?.currentMasaJob;
    const latestProcessedId = currentState?.data?.latestProcessedId as
      | string
      | undefined;

    // 1. Handle existing job
    if (
      currentJob &&
      currentJob.status !== "done" &&
      currentJob.status !== "error" &&
      currentJob.status !== "timeout"
    ) {
      console.log(
        `TwitterSearchService: Checking status for existing job ${currentJob.jobId}`,
      );
      const jobStatus = await this.masaClient.checkJobStatus(
        "twitter-scraper",
        currentJob.jobId,
      );

      if (jobStatus === "done") {
        console.log(
          `TwitterSearchService: Job ${currentJob.jobId} is done. Fetching results.`,
        );
        const results = await this.masaClient.getJobResults(
          "twitter-scraper",
          currentJob.jobId,
        );
        const items = results || [];

        // Determine the new latestProcessedId from these items
        let newLatestProcessedId = latestProcessedId;
        if (items.length > 0) {
          // Assuming items are sorted newest first, or we find the max ID
          const newestItem = items.reduce((prev, current) =>
            (current.ID || current.ExternalID) > (prev.ID || prev.ExternalID)
              ? current
              : prev,
          );
          newLatestProcessedId =
            newestItem.ID || newestItem.ExternalID || newLatestProcessedId;
        }

        const nextStateData: TwitterPlatformState = {
          ...currentState?.data, // Preserve other potential state fields
          latestProcessedId: newLatestProcessedId,
          currentMasaJob: {
            ...currentJob,
            status: "done",
            lastCheckedAt: new Date().toISOString(),
          },
        };
        console.log(
          `TwitterSearchService: Returning ${items.length} items. Next state:`,
          JSON.stringify(nextStateData, null, 2),
        );
        return { items, nextStateData };
      } else if (
        jobStatus === "error" ||
        jobStatus === "error(fetching_status)" ||
        jobStatus === null
      ) {
        console.error(
          `TwitterSearchService: Job ${currentJob.jobId} failed or status check error.`,
        );
        const nextStateData: TwitterPlatformState = {
          ...currentState?.data,
          currentMasaJob: {
            ...currentJob,
            status: "error",
            errorMessage: `Job status: ${jobStatus}`,
            lastCheckedAt: new Date().toISOString(),
          },
        };
        return { items: [], nextStateData };
      } else {
        // Still pending or processing
        console.log(
          `TwitterSearchService: Job ${currentJob.jobId} status: ${jobStatus}.`,
        );
        const nextStateData: TwitterPlatformState = {
          ...currentState?.data,
          currentMasaJob: {
            ...currentJob,
            status: jobStatus as MasaJobProgress["status"],
            lastCheckedAt: new Date().toISOString(),
          },
        };
        return { items: [], nextStateData };
      }
    }

    // 2. No active job, or previous job finished/errored - Submit a new job
    console.log(
      "TwitterSearchService: No active job or previous job completed/errored. Submitting new job.",
    );

    // Use latestProcessedId as sinceId for the query builder
    const queryOptionsForBuilder = { ...platformOptions };
    if (latestProcessedId) {
      queryOptionsForBuilder.sinceId = latestProcessedId;
    }
    const query = buildTwitterQuery(queryOptionsForBuilder);
    const maxResults = platformOptions.pageSize || DEFAULT_PAGE_SIZE;

    const masaApiOpts: MasaApiSearchOptions = { query, maxResults };

    const newJobId = await this.masaClient.submitSearchJob(
      "twitter-scraper",
      masaApiOpts.query,
      masaApiOpts.maxResults || DEFAULT_PAGE_SIZE,
    );

    if (newJobId) {
      console.log(
        `TwitterSearchService: New job submitted with ID: ${newJobId}`,
      );
      const newMasaJob: MasaJobProgress = {
        jobId: newJobId,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };
      const nextStateData: TwitterPlatformState = {
        ...currentState?.data, // Preserve other state fields like latestProcessedId from previous successful chunk
        latestProcessedId: latestProcessedId, // Carry over the ID that bounded this search
        currentMasaJob: newMasaJob,
      };
      return { items: [], nextStateData };
    } else {
      console.error("TwitterSearchService: Failed to submit new search job.");
      // Create a job progress state reflecting the submission error
      const errorMasaJob: MasaJobProgress = {
        jobId: "submission_failed_" + Date.now(), // Placeholder ID
        status: "error",
        submittedAt: new Date().toISOString(),
        errorMessage: "Failed to submit job to Masa API",
      };
      const nextStateData: TwitterPlatformState = {
        ...currentState?.data,
        latestProcessedId: latestProcessedId,
        currentMasaJob: errorMasaJob,
      };
      return { items: [], nextStateData };
    }
  }

  async shutdown(): Promise<void> {
    console.log("TwitterSearchService shutdown.");
    // Clear cache or other cleanup if necessary
    // this.searchCache.clear();
  }

  // Helper to transform MasaSearchResult to the desired Tweet format if needed.
  // For now, ServiceTweet is MasaSearchResult, so no transformation.
  // private transformToTweet(result: MasaSearchResult): UtilTweet {
  //   return {
  //     id: result.ExternalID || result.ID,
  //     text: result.Content,
  //     author_id: result.Metadata?.user_id,
  //     created_at: result.Metadata?.created_at,
  //     conversation_id: result.Metadata?.conversation_id,
  //     // Add other mappings
  //     __source: 'twitter_masa_service',
  //   };
  // }
}
