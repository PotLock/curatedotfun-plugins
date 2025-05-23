import {
  IPlatformSearchService,
  LastProcessedState,
  AsyncJobProgress,
} from "@curatedotfun/types";

import {
  MasaApiSearchOptions,
  MasaClient,
  MasaSearchResult,
} from "../../masa-client";
import { TwitterQueryOptionsOutput, TwitterPlatformState } from "./types";
import { buildTwitterQuery } from "./utils/twitterQueryBuilder";

export type ServiceTweet = MasaSearchResult;

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

  constructor(masaClient: MasaClient) {
    this.masaClient = masaClient;
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

    const currentAsyncJob = currentState?.data?.currentAsyncJob;
    const latestProcessedId = currentState?.data?.latestProcessedId as
      | string
      | undefined;

    // Process state data (async jobs)
    if (
      currentAsyncJob &&
      currentAsyncJob.status !== "done" &&
      currentAsyncJob.status !== "error" &&
      currentAsyncJob.status !== "timeout"
    ) {
      console.log(
        `TwitterSearchService: Checking status for existing job ${currentAsyncJob.jobId}`,
      );
      const jobStatus = await this.masaClient.checkJobStatus(
        "twitter-scraper",
        currentAsyncJob.jobId,
      );

      if (jobStatus === "done") {
        console.log(
          `TwitterSearchService: Job ${currentAsyncJob.jobId} is done. Fetching results.`,
        );
        const results = await this.masaClient.getJobResults(
          "twitter-scraper",
          currentAsyncJob.jobId,
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
          currentAsyncJob: {
            ...currentAsyncJob,
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
          `TwitterSearchService: Job ${currentAsyncJob.jobId} failed or status check error.`,
        );
        const nextStateData: TwitterPlatformState = {
          ...currentState?.data,
          currentAsyncJob: {
            ...currentAsyncJob,
            status: "error",
            errorMessage: `Job status: ${jobStatus}`,
            lastCheckedAt: new Date().toISOString(),
          },
        };
        return { items: [], nextStateData };
      } else {
        // Still pending or processing
        console.log(
          `TwitterSearchService: Job ${currentAsyncJob.jobId} status: ${jobStatus}.`,
        );
        const nextStateData: TwitterPlatformState = {
          ...currentState?.data,
          currentAsyncJob: {
            ...currentAsyncJob,
            status: jobStatus as AsyncJobProgress["status"],
            lastCheckedAt: new Date().toISOString(),
          },
        };
        return { items: [], nextStateData };
      }
    }

    // No active jobs, or previous job finished/errored - Submit a new job
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
      const newAsyncJob: AsyncJobProgress = {
        jobId: newJobId,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };
      const nextStateData: TwitterPlatformState = {
        ...currentState?.data, // Preserve other state fields like latestProcessedId from previous successful chunk
        latestProcessedId: latestProcessedId, // Carry over the ID that bounded this search
        currentAsyncJob: newAsyncJob,
      };
      return { items: [], nextStateData };
    } else {
      console.error("TwitterSearchService: Failed to submit new search job.");
      // Create a job progress state reflecting the submission error
      const errorAsyncJob: AsyncJobProgress = {
        jobId: "submission_failed_" + Date.now(), // Placeholder ID
        status: "error",
        submittedAt: new Date().toISOString(),
        errorMessage: "Failed to submit job to Masa API",
      };
      const nextStateData: TwitterPlatformState = {
        ...currentState?.data,
        latestProcessedId: latestProcessedId,
        currentAsyncJob: errorAsyncJob,
      };
      return { items: [], nextStateData };
    }
  }

  async shutdown(): Promise<void> {
    console.log("TwitterSearchService shutdown.");
  }
}
