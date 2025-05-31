# Adding New Services to MasaSourcePlugin

This guide outlines the process for adding a new platform search service to the `@curatedotfun/masa-source` plugin. The plugin uses a service-based architecture, where each service handles communication with a specific data source or platform via the Masa API.

## Overview of Service Architecture

The `MasaSourcePlugin` relies on a central **Service Registry** located in `packages/masa-source/src/services/index.ts`. This registry contains descriptors for each available platform service. Each descriptor includes:

1.  `platformType`: A unique string identifier for the service (e.g., `"twitter-scraper"`, `"news-service"`).
2.  `factory`: A function that takes a `MasaClient` instance and returns an instance of your service class. Your service class must implement the `IPlatformSearchService` interface.
3.  `config`: An object containing:
    *   `optionsSchema`: A Zod schema used to validate the search options specific to this platform.
    *   `preparePlatformArgs`: A function that takes the generic `SourcePluginSearchOptions` and transforms/extracts the arguments relevant to this specific platform, returning an object that matches the input type of your `optionsSchema`.

When `MasaSourcePlugin` initializes, it iterates through this registry, instantiates each service using its factory, and stores the service instance and its configuration.

During a `search` operation, the plugin:
1.  Uses the `searchPlatformType` from the `SourcePluginSearchOptions` to find the corresponding service and its configuration.
2.  Calls the `preparePlatformArgs` function to get the platform-specific arguments.
3.  Validates these arguments against the service's `optionsSchema`.
4.  Calls the `search` method on the service instance with the validated options and the current `LastProcessedState`.

## Steps to Create and Register a New Service

Let's say you want to add a service for "MyPlatform".

### 1. Define Platform-Specific State (Optional but Recommended)

If your service needs to maintain state between search calls (e.g., for pagination, tracking last processed items, or managing ongoing jobs), define an interface that extends `PlatformState` from `@curatedotfun/types`.

**File:** `packages/masa-source/src/services/my-platform/types/index.ts`

```typescript
import { PlatformState } from "@curatedotfun/types";

export interface MyPlatformState extends PlatformState {
  // 'latestProcessedId' from PlatformState can be used.
  // 'currentMasaJob' from PlatformState can be used for Masa API job polling.
  
  // Add any other MyPlatform-specific state fields here
  // e.g., nextPageToken?: string;
  // e.g., customCounter?: number;
}
```

If your service is stateless beyond what `PlatformState` offers, you can skip creating a custom state type and use `PlatformState` directly.

### 2. Define Zod Schema for Search Options

Create a Zod schema to define and validate the search options specific to "MyPlatform".

**File:** `packages/masa-source/src/services/my-platform/types/index.ts` (can be in the same file as your state)

```typescript
import { z } from "zod";

export const MyPlatformOptionsSchema = z.object({
  query: z.string(),
  filterByCategory: z.array(z.string()).optional(),
  maxResults: z.number().int().positive().optional(),
  // Add other MyPlatform-specific options
}).strict(); // .strict() is recommended to catch unexpected options

export type MyPlatformOptionsInput = z.input<typeof MyPlatformOptionsSchema>;
export type MyPlatformOptionsOutput = z.output<typeof MyPlatformOptionsSchema>;
```

### 3. Implement the Service Class

Create a class that implements the `IPlatformSearchService` interface from `@curatedotfun/types`.

**File:** `packages/masa-source/src/services/my-platform/MyPlatformSearchService.ts`

```typescript
import {
  IPlatformSearchService,
  LastProcessedState,
  MasaJobProgress, // If using Masa jobs
} from "@curatedotfun/types";
import { MasaClient, MasaSearchResult } from "../../masa-client"; // Adjust path as needed
import { MyPlatformOptionsOutput, MyPlatformState } from "./types"; // Your platform types

export class MyPlatformSearchService
  implements
    IPlatformSearchService<
      MasaSearchResult, // Assuming items are MasaSearchResult, change if not
      MyPlatformOptionsOutput,
      MyPlatformState
    >
{
  private masaClient: MasaClient;

  constructor(masaClient: MasaClient) {
    this.masaClient = masaClient;
  }

  async initialize(): Promise<void> {
    // Optional: Implement if your service needs specific initialization
    console.log("MyPlatformSearchService initialized.");
  }

  async search(
    options: MyPlatformOptionsOutput,
    currentState: LastProcessedState<MyPlatformState> | null
  ): Promise<{
    items: MasaSearchResult[];
    nextStateData: MyPlatformState | null;
  }> {
    console.log("MyPlatformSearchService searching with options:", options);
    if (currentState) {
      console.log("Current state:", currentState.data);
    }

    // Example: If your service interacts with Masa API jobs (Option B polling)
    let currentMasaJob = currentState?.data.currentMasaJob || null;
    
    if (!currentMasaJob) {
      // 1. Submit job to Masa
      // const masaQuery = this.buildMasaQuery(options, currentState?.data.latestProcessedId);
      // currentMasaJob = await this.masaClient.submitSearchJob("my-platform-endpoint", masaQuery);
      // return { items: [], nextStateData: { ...currentState?.data, currentMasaJob, latestProcessedId: currentState?.data.latestProcessedId } };
    }
    
    // 2. Check job status
    // const jobStatus = await this.masaClient.checkJobStatus(currentMasaJob.jobId);
    // if (jobStatus.status !== "completed") {
    //   // Job still in progress or failed
    //   return { items: [], nextStateData: { ...currentState?.data, currentMasaJob: jobStatus, latestProcessedId: currentState?.data.latestProcessedId } };
    // }

    // 3. Get job results
    // const results = await this.masaClient.getJobResults<MasaSearchResult>(currentMasaJob.jobId);
    // const newLatestProcessedId = results.length > 0 ? results[results.length - 1].id : currentState?.data.latestProcessedId;

    // For simplicity, let's assume a direct fetch or mock data:
    const items: MasaSearchResult[] = [
      // { id: "item1", content: "MyPlatform data 1", url: "...", rawData: {} },
    ];
    
    // Determine the next state
    const nextStateData: MyPlatformState | null = {
      // latestProcessedId: newLatestProcessedId, // Update based on fetched items
      // currentMasaJob: null, // Reset job if completed and results fetched
      // ... any other state updates
    };

    return { items, nextStateData };
  }

  async shutdown(): Promise<void> {
    // Optional: Implement if your service needs cleanup on shutdown
    console.log("MyPlatformSearchService shutting down.");
  }

  // Optional: Helper method to build query for Masa API
  // private buildMasaQuery(options: MyPlatformOptionsOutput, sinceId?: string | number | Record<string, any>): Record<string, any> {
  //   const query: Record<string, any> = { q: options.query };
  //   if (options.maxResults) query.count = options.maxResults;
  //   if (sinceId) query.since_id = sinceId;
  //   // ... map other options to Masa API parameters
  //   return query;
  // }
}
```

**Key points for `search` method:**
*   It receives validated `options` and the `currentState`.
*   It should perform the actual data fetching (e.g., calling `this.masaClient` methods).
*   It must return an object with:
    *   `items`: An array of fetched items (e.g., `MasaSearchResult[]`).
    *   `nextStateData`: An object representing the new state for this platform (e.g., `MyPlatformState`), or `null` if the search is complete or no new state is needed. This state will be passed back in the next call for this platform.
*   Implement polling logic (submit job, check status, get results) if interacting with asynchronous Masa API jobs. The `currentMasaJob` and `latestProcessedId` from `PlatformState` (via `MyPlatformState`) are crucial for this.

### 4. Implement `preparePlatformArgs` Function

This function adapts the generic `SourcePluginSearchOptions` to the input type expected by your service's Zod schema (`MyPlatformOptionsInput`).

**File:** `packages/masa-source/src/services/index.ts` (or you can define it in your service's type file and import it)

```typescript
// Add this function in services/index.ts or import it

import { SourcePluginSearchOptions } from "@curatedotfun/types";
import { MyPlatformOptionsInput } from "./my-platform/types"; // Adjust path

const prepareMyPlatformArgs = (
  options: SourcePluginSearchOptions
): MyPlatformOptionsInput => {
  const { query: baseQuery, pageSize, ...platformSpecificOptions } = options;

  // platformSpecificOptions.platformArgs is where the plugin consumer
  // is expected to put the options specific to "MyPlatform".
  const rawOptions: MyPlatformOptionsInput = {
    ...(platformSpecificOptions.platformArgs as Partial<MyPlatformOptionsInput>), // Cast platformArgs
    // Example: If 'query' is a top-level option but also part of MyPlatformOptionsInput
    ...(baseQuery && !(platformSpecificOptions.platformArgs as Partial<MyPlatformOptionsInput>)?.query && { query: baseQuery }),
    // Example: If 'pageSize' maps to 'maxResults' for MyPlatform
    ...(pageSize && !(platformSpecificOptions.platformArgs as Partial<MyPlatformOptionsInput>)?.maxResults && { maxResults: pageSize }),
  };
  
  // Clean up any undefined properties if your schema doesn't expect them
  // or if they have defaults in the Masa API.
  // if (rawOptions.maxResults === undefined) delete rawOptions.maxResults;

  return rawOptions;
};
```

### 5. Add Entry to Service Registry

Finally, add an entry for your new service in `packages/masa-source/src/services/index.ts`.

```typescript
// packages/masa-source/src/services/index.ts

// ... other imports
import { MasaClient, MasaSearchResult } from "../masa-client"; // Ensure MasaSearchResult is imported if used as item type
import { MyPlatformSearchService } from "./my-platform/MyPlatformSearchService"; // Import your service
import { 
  MyPlatformOptionsSchema, 
  MyPlatformOptionsInput, // For preparePlatformArgs return type
  MyPlatformOptionsOutput, // For IPlatformSearchService and factory
  MyPlatformState // For IPlatformSearchService and factory
} from "./my-platform/types"; // Import your service's types

// ... prepareMyPlatformArgs function (defined above or imported)

export const serviceRegistry: ServiceRegistryEntry<any, any, any, any>[] = [
  // ... existing services (e.g., Twitter)
  {
    platformType: "my-platform-scraper", // Unique identifier
    factory: (masaClient: MasaClient) =>
      new MyPlatformSearchService(masaClient) as IPlatformSearchService<
        MasaSearchResult, // Or your specific item type
        MyPlatformOptionsOutput,
        MyPlatformState
      >,
    config: {
      optionsSchema: MyPlatformOptionsSchema,
      preparePlatformArgs: prepareMyPlatformArgs, // Your prepare function
    },
  },
];

export default serviceRegistry;
```
Make sure the generic type arguments for `IPlatformSearchService` in the factory match your service's implementation (item type, options output type, platform state type).

## How the Plugin Uses the New Service

Once your service is correctly implemented and registered:

1.  **Initialization**: `MasaSourcePlugin` will automatically create an instance of `MyPlatformSearchService` (via its factory) and store its configuration.
2.  **Search**: When a consumer calls `plugin.search({ type: "my-platform-scraper", ... })`:
    *   The plugin will find your service and its config.
    *   `prepareMyPlatformArgs` will be called.
    *   The result will be validated against `MyPlatformOptionsSchema`.
    *   `MyPlatformSearchService.search()` will be invoked with the validated options.
    *   The results and next state from your service will be returned to the plugin consumer.

## File Placement Conventions

*   **Service-specific files**: Place all files related to a single service (e.g., `MyPlatformSearchService.ts`, `types/index.ts` for state and schemas, utility functions) under a dedicated directory within `packages/masa-source/src/services/`. For example:
    *   `packages/masa-source/src/services/my-platform/`
    *   `packages/masa-source/src/services/my-platform/MyPlatformSearchService.ts`
    *   `packages/masa-source/src/services/my-platform/types/index.ts`
    *   `packages/masa-source/src/services/my-platform/utils/index.ts` (if needed)
*   **Service Registry**: The main registry is in `packages/masa-source/src/services/index.ts`.

By following these steps, you can extend `MasaSourcePlugin` with new data sources in a structured and maintainable way.
