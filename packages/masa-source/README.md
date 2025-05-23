# Masa Source Plugin for curate.fun

The Masa Source plugin enables content ingestion from various social and web platforms using the [Masa Data](http://data.masa.ai/) API. It provides a flexible way to tap into Masa's decentralized data network for sourcing content.

## 🔧 Setup Guide

To use the Masa Source plugin, you need to configure it within your `curate.config.json` file.

1.  **Plugin Registration:**
    Ensure the Masa Source plugin is declared in your `curate.config.json` so it can be loaded dynamically.

    ```jsonc
    {
      "plugins": {
        "@curatedotfun/masa-source": {
          "type": "source",
          "url": "https://unpkg.com/@curatedotfun/masa-source@latest/dist/remoteEntry.js" // Loaded via Module Federation
        }
      }
    }
    ```

2.  **Source Configuration:**
    Add the Masa Source plugin to a feed's `sources` array in your `curate.config.json`.

    ```jsonc
    {
      "feeds": [
        {
          "id": "your-masa-feed",
          "sources": [
            {
              "plugin": "@curatedotfun/masa-source",
              "config": {
                "apiKey": "{MASA_API_KEY}" // hydrated during runtime
                // "baseUrl": "https://data.masalabs.ai/api/v1" // default
              },
              "search": [
                // Define one or more search configurations here, following Platform
              ]
            }
          ]
        }
      ]
    }
    ```

    > **Note:** The `{MASA_API_KEY}` should be configured as an environment variable (e.g., `MASA_API_KEY`) and will be injected at runtime.

## Features

### Configuration Options

#### Plugin-Level Configuration (`config` block)

-   `apiKey` (required, string): Your API key for accessing the Masa API.
-   `baseUrl` (optional, string): The base URL for the Masa API. Defaults to the official production URL if not specified.

#### Search-Level Configuration (within the `search` array)

Each object in the `search` array defines a specific query to be executed by the plugin.

-   `type` (required, string): Specifies the platform or data type to search on Masa (e.g., `"twitter-scraper"`). This corresponds to a registered service within the Masa Source plugin.
-   `query` (optional, string): A general query string. Its interpretation depends on the specific service (`type`). For some services, this might map to a primary search term (e.g., `allWords` for Twitter).
-   `pageSize` (optional, number): A general hint for how many items to fetch per request. The service might override or interpret this.
-   `language` (optional, string): A language code (e.g., "en", "es") to filter results by language if supported by the service.
-   `platformArgs` (required, object): An object containing options specific to the service defined by `type`. The structure of `platformArgs` varies per service.

### Supported Services

The Masa Source plugin uses a service-based architecture. Each service handles a specific platform.

#### Twitter Scraper (`type: "twitter-scraper"`)

This service fetches tweets from Twitter via Masa.

**Example `platformArgs` for Twitter:**

```jsonc
{
  "platformArgs": {
    "allWords": "web3 community", // Search for tweets containing all these words
    "hashtags": ["#NEARProtocol", "#opensource"], // Filter by hashtags
    "fromAccounts": ["neardevgov", "pagodaplatform"], // Tweets from these accounts
    "mentioningAccounts": ["curatedotfun", "potlock_"], // Tweets mentioning these accounts
    "sinceDate": "2023-01-31", // Fetch tweets since this date (YYYY-MM-DD)
    "sinceId": "1234567890123456789", // Fetch tweets newer than this Tweet ID
    "minLikes": 10,
    "pageSize": 25 // Specific to the service's handling of page size
  }
}
```

**Full Example Configuration for Twitter Search:**

```jsonc
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
              "query": "decentralized social media", // General query, is 'allWords'
              "pageSize": 50, // A general hint for how many items to fetch per request. The service might override or interpret this. 
              "language": "en",
              "platformArgs": {
                // More specific Twitter options:
                "anyWords": "blockchain crypto", // Tweets with any of these words
                "hashtags": ["#DeSo", "#SocialFi"],
                "minRetweets": 5,
                "includeReplies": false,
                "sinceDate": "YYYY-MM-DD", // Example: Fetch tweets since this date
                "mentioningAccounts": ["some_project"] // Example: Tweets mentioning a specific account
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

### State Management and Resumable Search

The Masa Source plugin supports resumable search by managing state between calls. This state is passed via the `lastProcessedState` argument to the `search` method and returned as `nextLastProcessedState` in the results. It typically contains:

-   **`latestProcessedId`**: For services that return items in a sequence (like tweets by ID), this tracks the ID of the most recent item successfully processed. This is crucial for ensuring that subsequent jobs request data *after* this ID, preventing duplicate processing and allowing searches to resume.

-   **`currentMasaJob`**: For services involving asynchronous jobs on the Masa network (like the Twitter scraper), the `currentMasaJob` object within the `data` field of `LastProcessedState` tracks the job's progress.
    -   When the plugin's `search` method is called with a `lastProcessedState` indicating an active job, the plugin checks the job's current status with Masa.
    -   If the job has completed successfully ('done'), the plugin retrieves the results.
    -   If the job is still pending, the plugin returns no new items but provides an updated `nextLastProcessedState` with the latest job status.
    -   The consuming system re-calls `search` with the `nextLastProcessedState` until the job is 'done' or an 'error' occurs.

#### Example: Consumer Handling of Asynchronous Masa Jobs

The consumer (e.g., your feed processing logic) should re-invoke the `search` method with the last returned state until the job completes. Conceptual pseudo-code:

```typescript
// Assuming 'masaSourcePlugin' is an initialized instance of MasaSourcePlugin
// And 'initialSearchOptions' are your desired search parameters

async function fetchAllResultsWithJobPolling(plugin, options) {
  let allItems = [];
  let currentLastProcessedState = null;
  let continueFetching = true;
  const MAX_ATTEMPTS = 10; // Safety break
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
      console.log(`Job ${currentLastProcessedState.data.currentMasaJob.jobId} is done.`);
      continueFetching = false; 
    } else if (jobStatus === 'error' || jobStatus === 'timeout') {
      console.error(`Job ${currentLastProcessedState.data.currentMasaJob.jobId} failed: ${jobStatus}. Error: ${currentLastProcessedState.data.currentMasaJob.errorMessage}`);
      continueFetching = false;
    } else if (jobStatus === 'submitted' || jobStatus === 'processing' || jobStatus === 'pending') {
      console.log(`Job ${currentLastProcessedState.data.currentMasaJob.jobId} is ${jobStatus}. Waiting...`);
      await sleep(5000); // Wait (e.g., 5 seconds)

      searchResults = await plugin.search(currentLastProcessedState, options);

      if (searchResults.items.length > 0) {
        allItems = allItems.concat(searchResults.items);
      }
      currentLastProcessedState = searchResults.nextLastProcessedState;
      
      if (!currentLastProcessedState) {
         console.log("No further state returned, assuming completion.");
         continueFetching = false;
      }
    } else {
      console.log("No active job in state or unknown status. Assuming completion.");
      continueFetching = false;
    }
  }

  if (attempts >= MAX_ATTEMPTS) {
    console.warn("Reached max polling attempts.");
  }

  console.log(`Total items fetched: ${allItems.length}`);
  return allItems;
}

// Helper sleep function
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
```

**Note:** The `sleep` duration and `MAX_ATTEMPTS` should be configured based on expected job completion times.

### Output Format

The Masa Source plugin outputs items conforming to the `MasaSearchResult` structure:

```typescript
export interface MasaSearchResult {
  ID: string; // Unique identifier for the result from Masa
  ExternalID: string; // Platform-specific external identifier (e.g., Tweet ID)
  Content: string; // Main text content of the item
  Metadata: {
    author?: string; // Author's username or identifier
    user_id?: string; // Author's platform-specific user ID
    created_at?: string; // ISO 8601 timestamp
    conversation_id?: string;
    IsReply?: boolean;
    InReplyToStatusID?: string;
    [key: string]: any; // Other platform-specific metadata
  };
  [key: string]: any; // Other top-level fields from Masa
}
```
The exact fields depend on the Masa service.

## Adding New Services

The plugin is extensible. To add new services for different platforms available through Masa, refer to the developer documentation: [`./docs/adding-new-services.md`](./docs/adding-new-services.md).

## 🔐 Security Considerations

-   **API Key Management**: Your Masa API key is sensitive. Store it securely (e.g., as an environment variable) and do not hardcode it.
-   **Rate Limiting**: Be mindful of Masa API rate limits and those of underlying platforms. Configure search frequencies and `pageSize` appropriately.

## Development

To develop the Masa Source plugin:

```bash
# Install dependencies (usually done at the root of the monorepo)
# bun install 

# Build the plugin
bun run build

# Run in development mode
bun run dev

# Lint the code
bun run lint

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run coverage
```

## License

MIT

## 🔗 Related Resources

-   [Masa Data Documentation](https://developers.masa.ai/docs/index-API/masa-api-search)
-   For details on specific service options (like Twitter scraper options), refer to Masa's API documentation for those endpoints.
