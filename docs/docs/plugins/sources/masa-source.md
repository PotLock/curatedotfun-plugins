---
sidebar_position: 3
---

#  सोर्स Masa Source Plugin

The Masa Source plugin enables content ingestion from various social and web platforms using the [Masa Finance](https://masa.finance/) API. It provides a flexible way to tap into Masa's decentralized data network for sourcing content.

## 🔧 Setup Guide

1.  **Plugin Registration (if not already globally registered):**
    Ensure the Masa Source plugin is declared in your `curate.config.json` if it's intended to be loaded dynamically. Typically, source plugins might be pre-registered or loaded via a central mechanism. If manual registration is needed:

    ```json
    {
      "plugins": {
        "@curatedotfun/masa-source": {
          "type": "source",
          // "url": "https://unpkg.com/@curatedotfun/masa-source@latest/dist/remoteEntry.js" // If loaded via Module Federation
        }
      }
    }
    ```

2.  **Source Configuration:**
    Add the Masa Source plugin to a feed's `sources` array in your `curate.config.json`.

    ```json
    {
      "feeds": [
        {
          "id": "your-masa-feed",
          "sources": [
            {
              "plugin": "@curatedotfun/masa-source",
              "config": {
                "apiKey": "{MASA_API_KEY}"
                // "baseUrl": "https://data.masalabs.ai/api/v1" 
              },
              "search": [
                // Define one or more search configurations here
              ]
            }
          ]
        }
      ]
    }
    ```

    :::info
    The `{MASA_API_KEY}` should be configured as an environment variable (e.g., `MASA_API_KEY`) and will be injected at runtime.
    :::

## Features

### Configuration Options

#### Plugin-Level Configuration (`config` block):

-   `apiKey` (required, string): Your API key for accessing the Masa API.
-   `baseUrl` (optional, string): The base URL for the Masa API. Defaults to the official production URL if not specified.

#### Search-Level Configuration (within the `search` array):

Each object in the `search` array defines a specific query to be executed by the plugin.

-   `type` (required, string): Specifies the platform or data type to search on Masa (e.g., `"twitter-scraper"`). This corresponds to a registered service within the Masa Source plugin.
-   `query` (optional, string): A general query string. Its interpretation depends on the specific service (`type`). For some services, this might map to a primary search term (e.g., `allWords` for Twitter).
-   `pageSize` (optional, number): A general hint for how many items to fetch per request. The service might override or interpret this.
-   `language` (optional, string): A language code (e.g., "en", "es") to filter results by language, if supported by the service.
-   `platformArgs` (required, object): An object containing options specific to the service defined by `type`. The structure of `platformArgs` varies per service.

### Supported Services

The Masa Source plugin uses a service-based architecture. Each service handles a specific platform.

#### Twitter Scraper (`type: "twitter-scraper"`)

This service fetches tweets from Twitter via Masa.

**Example `platformArgs` for Twitter:**

```json
{
  "platformArgs": {
    "allWords": "web3 community", // Search for tweets containing all these words
    "hashtags": ["#NEARProtocol", "#opensource"], // Filter by hashtags
    "fromAccounts": ["neardevgov", "pagodaplatform"], // Tweets from these accounts
    // "sinceId": "1234567890", // Fetch tweets newer than this ID (for pagination)
    "minLikes": 10,
    "pageSize": 25 // Specific to the service's handling of page size
  }
}
```

**Full Example Configuration for Twitter Search:**

```json
{
  "feeds": [
    {
      "id": "twitter-web3-feed",
      "sources": [
        {
          "plugin": "@curatedotfun/masa-source",
          "config": {
            "apiKey": "{MASA_API_KEY}"
          },
          "search": [
            {
              "type": "twitter-scraper",
              "query": "decentralized social media", // General query, might be used as default for 'allWords'
              "pageSize": 50, // General page size hint
              "language": "en",
              "platformArgs": {
                // More specific Twitter options:
                "anyWords": "blockchain crypto", // Tweets with any of these words
                "hashtags": ["#DeSo", "#SocialFi"],
                "minRetweets": 5,
                "includeReplies": false
              }
            },
            {
              "type": "twitter-scraper",
              "platformArgs": {
                "fromAccounts": ["elonmusk"],
                "allWords": "innovation",
                "pageSize": 10
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### State Management and Resumable search

The Masa Source plugin supports resumable search by managing state between calls. This state is passed via the `lastProcessedState` argument to the `search` method and returned as `nextLastProcessedState` in the results. It typically contains:

-   **`latestProcessedId`**: For services that return items in a sequence (like tweets by ID), this tracks the ID of the most recent item successfully processed. This is crucial for:
    *   Ensuring that if a search is broken into multiple Masa jobs (due to `pageSize` or fetching large amounts of data over time), subsequent jobs request data *after* this ID, preventing duplicate processing.
    *   Allowing search to resume from where they left off in previous runs.

-   **`currentMasaJob`**: For services that involve asynchronous jobs on the Masa network (like the Twitter scraper), the `currentMasaJob` object within the `data` field of `LastProcessedState` tracks the job's progress.
    *   When the plugin's `search` method is called with a `lastProcessedState` indicating an active job (e.g., status is 'submitted' or 'processing'), the plugin checks the job's current status with Masa.
    *   If the job has completed successfully ('done'), the plugin retrieves the results and returns them along with any new items. The `nextLastProcessedState` will reflect that the job is 'done' and may include an updated `latestProcessedId`.
    *   If the job is still pending, the plugin will typically return no new items in the current call. However, it will provide an updated `nextLastProcessedState` containing the latest status of the job (e.g., 'processing').
    *   If a job encounters an error or times out, the `nextLastProcessedState` will indicate this, allowing the consuming system to handle it.
    *   The system using the plugin is responsible for re-calling the `search` method with the `nextLastProcessedState` received from the previous call. This process is repeated until the job is 'done' or an 'error' status is returned, or until no `nextLastProcessedState` is provided (signifying the end of data for that query).

This state is managed by the plugin and its services, and it's essential for the consuming application to pass the `nextLastProcessedState` from one call to the `lastProcessedState` of the subsequent call to ensure continuity and proper job handling.

#### Example: Consumer Handling of Asynchronous Masa Jobs

When a Masa service initiates an asynchronous job, the plugin doesn't poll internally. Instead, it returns the job's status, and the consumer (e.g., your feed processing logic) should re-invoke the `search` method with the last returned state until the job completes.

Here's a conceptual pseudo-code example of how a consumer might manage this:

```typescript
// Assuming 'masaSourcePlugin' is an initialized instance of MasaSourcePlugin
// And 'initialSearchOptions' are your desired search parameters

async function fetchAllResultsWithJobPolling(plugin, options) {
  let allItems = [];
  let currentLastProcessedState = null;
  let continueFetching = true;
  const MAX_ATTEMPTS = 10; // Safety break for long-running or stuck jobs
  let attempts = 0;

  console.log("Starting initial search...");
  let searchResults = await plugin.search(currentLastProcessedState, options);
  
  if (searchResults.items.length > 0) {
    console.log(`Fetched ${searchResults.items.length} items in initial call.`);
    allItems = allItems.concat(searchResults.items);
  }
  currentLastProcessedState = searchResults.nextLastProcessedState;

  while (continueFetching && currentLastProcessedState && attempts < MAX_ATTEMPTS) {
    attempts++;
    const jobStatus = currentLastProcessedState.data?.currentMasaJob?.status;

    if (jobStatus === 'done') {
      console.log(`Job ${currentLastProcessedState.data.currentMasaJob.jobId} is done. Final items might be in this payload if not already fetched.`);
      // If the 'done' status call itself returns items, they are already included by the plugin.
      // No more polling needed for *this* job.
      // If latestProcessedId is updated, it means we can potentially start a *new* job/search from this point.
      continueFetching = false; // Or decide if a new search with updated latestProcessedId is needed
    } else if (jobStatus === 'error' || jobStatus === 'timeout') {
      console.error(`Job ${currentLastProcessedState.data.currentMasaJob.jobId} failed with status: ${jobStatus}. Error: ${currentLastProcessedState.data.currentMasaJob.errorMessage}`);
      continueFetching = false;
    } else if (jobStatus === 'submitted' || jobStatus === 'processing' || jobStatus === 'pending') {
      console.log(`Job ${currentLastProcessedState.data.currentMasaJob.jobId} is ${jobStatus}. Waiting before re-querying...`);
      await sleep(5000); // Wait for 5 seconds (adjust as needed)

      console.log(`Re-querying with last state for job ${currentLastProcessedState.data.currentMasaJob.jobId}...`);
      searchResults = await plugin.search(currentLastProcessedState, options);

      if (searchResults.items.length > 0) {
        console.log(`Fetched ${searchResults.items.length} items.`);
        allItems = allItems.concat(searchResults.items);
      }
      currentLastProcessedState = searchResults.nextLastProcessedState;
      
      if (!currentLastProcessedState) {
         console.log("No further state returned, assuming completion or end of data for this query.");
         continueFetching = false;
      }
    } else {
      // Unknown status or no job info, might be a direct fetch without jobs
      console.log("No active job in state, or job status unknown. Assuming direct fetch completed or no further state.");
      continueFetching = false;
    }
  }

  if (attempts >= MAX_ATTEMPTS) {
    console.warn("Reached max polling attempts. Job might be stuck or taking too long.");
  }

  console.log(`Total items fetched: ${allItems.length}`);
  return allItems;
}

// Helper sleep function (ensure this is available in your environment)
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// To use it:
// fetchAllResultsWithJobPolling(masaSourcePlugin, initialSearchOptions)
//   .then(items => console.log("Final results:", items))
//   .catch(error => console.error("Error during fetch:", error));
```

**Note:** The `sleep` duration and `MAX_ATTEMPTS` should be configured based on expected job completion times and API rate limits. The `initialSearchOptions` should remain consistent across the polling calls for a single logical search operation, as the `currentLastProcessedState` handles the pagination and job continuation.

## Output Format

The Masa Source plugin outputs items that conform to the `MasaSearchResult` structure:

```typescript
export interface MasaSearchResult {
  ID: string; // Unique identifier for the result from Masa
  ExternalID: string; // Platform-specific external identifier (e.g., Tweet ID)
  Content: string; // Main text content of the item
  Metadata: {
    author?: string; // Author's username or identifier
    user_id?: string; // Author's platform-specific user ID
    created_at?: string; // ISO 8601 timestamp of when the content was created
    conversation_id?: string; // ID of the conversation thread, if applicable
    IsReply?: boolean; // Indicates if the item is a reply
    InReplyToStatusID?: string; // ID of the status this item is replying to, if applicable
    // Other platform-specific metadata fields may also be present
    [key: string]: any;
  };
  // Other top-level fields returned by Masa may also be present
  [key: string]: any;
}
```
The exact fields available within `Metadata` and at the top level will depend on the specific Masa service and the data it returns for each item.

## Adding New Services

The plugin is designed to be extensible. New services for different platforms or data types available through Masa can be added. For instructions on how to develop and register a new service, please refer to the internal developer documentation: `[Adding New Services to MasaSourcePlugin](./../../../../packages/masa-source/docs/adding-new-services.md)`. (Note: This link might need adjustment based on the final doc structure).

## 🔐 Security Considerations

-   **API Key Management**: Your Masa API key is sensitive. Ensure it is stored securely (e.g., as an environment variable) and not hardcoded into configurations.
-   **Rate Limiting**: Be mindful of Masa API rate limits and the rate limits of underlying platforms accessed via Masa. Configure search frequencies and `pageSize` appropriately.

## 🔗 Related Resources

-   [Masa Finance Documentation](https://docs.masa.finance/)
-   For details on specific service options (like Twitter scraper options), refer to Masa's API documentation for those endpoints.
