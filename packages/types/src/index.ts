export type PluginType = "transformer" | "distributor" | "source";

// Zod import for schema definition
import { z } from "zod";

// Base plugin interface
export interface BotPlugin<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> {
  type: PluginType;
  initialize: (config?: TConfig) => Promise<void>;
  shutdown?: () => Promise<void>;
}

// Specific plugin interfaces
export interface TransformerPlugin<
  TInput = unknown,
  TOutput = unknown,
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> extends BotPlugin<TConfig> {
  type: "transformer";
  transform: (args: ActionArgs<TInput, TConfig>) => Promise<TOutput>;
}

export interface DistributorPlugin<
  TInput = unknown,
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> extends BotPlugin<TConfig> {
  type: "distributor";
  distribute: (args: ActionArgs<TInput, TConfig>) => Promise<void>;
}

// Plugin action type (used by all plugins)
export interface ActionArgs<TInput = unknown, TConfig = unknown> {
  input: TInput;
  config?: TConfig;
}

/**
 * Plugin configuration
 */
export interface PluginConfig<
  T extends PluginType,
  TConfig = Record<string, unknown>,
> {
  type: T;
  url: string;
  config?: TConfig;
}

/**
 * Plugin type mapping
 */
export type PluginTypeMap<
  TInput = unknown,
  TOutput = unknown,
  TConfig extends Record<string, unknown> = Record<string, unknown>,
  TItem = any,
> = {
  transformer: TransformerPlugin<TInput, TOutput, TConfig>;
  distributor: DistributorPlugin<TInput, TConfig>;
  source: SourcePlugin<TItem, TConfig>;
};

// Source Plugin Types
export interface LastProcessedState<
  TData extends Record<string, any> = Record<string, any>,
> {
  id?: string | null; // Retain for now, though platform-specific state might handle this better
  timestamp?: number | null; // Retain for now
  // The `data` field now holds the platform-specific state, strongly typed.
  // This will typically be an object conforming to PlatformState or a derivative.
  data: TData;
  // Removed [key: string]: any; from the top level to encourage use of the typed `data` field.
}

export interface SourcePluginSearchOptions<
  TPlatformOpts = Record<string, any>,
> {
  type: string; // e.g., "twitter-scraper", "reddit-scraper". The plugin will interpret this.
  query: string; // Base query string, can also be part of TPlatformOpts if a platform doesn't use a generic query string
  pageSize?: number;
  platformArgs?: TPlatformOpts; // Typed platform-specific arguments
  // Retaining [key: string]: any for flexibility with less strictly typed platforms or additional dynamic args,
  // but platformArgs should be the primary way to pass structured options.
  [key: string]: any;
}

export interface SourcePluginSearchResults<
  TItem = any,
  TPlatformState extends PlatformState = PlatformState,
> {
  items: TItem[];
  nextLastProcessedState: LastProcessedState<TPlatformState> | null;
}

export interface SourcePlugin<
  TItem = any, // The type of items the source plugin will produce
  TConfig extends Record<string, unknown> = Record<string, unknown>, // Configuration for the plugin instance
  TPlatformState extends PlatformState = PlatformState, // Generic for the platform-specific part of LastProcessedState
> extends BotPlugin<TConfig> {
  type: "source";

  /**
   * Performs a search operation based on the provided state and options.
   * The plugin instance should be initialized with its specific configuration (TConfig)
   * which might include API keys or other static settings.
   *
   * @param lastProcessedState The state from the previous search call, allowing resumption.
   *                           Null if this is the first call or if state is not applicable/reset.
   *                           Now uses the generic LastProcessedState with TPlatformState.
   * @param options An object containing dynamic configuration options for this specific search
   *                call, such as the query, type, and page size.
   * @returns A promise that resolves with the search results and the state to be used
   *          for the next call. SearchResults also becomes generic.
   */
  search(
    lastProcessedState: LastProcessedState<TPlatformState> | null,
    options: SourcePluginSearchOptions<any>, // platformArgs will be validated by the service
  ): Promise<SourcePluginSearchResults<TItem, TPlatformState>>;
}

// Defines the progress of a job submitted to an external service like Masa
export interface MasaJobProgress {
  jobId: string;
  status: "submitted" | "pending" | "processing" | "done" | "error" | "timeout";
  submittedAt: string; // ISO timestamp
  lastCheckedAt?: string; // ISO timestamp
  errorMessage?: string;
  // Optionally, store the original query or parameters for this job
  // queryDetails?: Record<string, any>;
}

// Generic platform state for services that manage long-running jobs
// and resumable searches.
export interface PlatformState {
  // For overall resumable search (across multiple jobs/chunks)
  // This cursor can be a string, number, or a more complex object
  // depending on the platform's pagination/cursor mechanism.
  latestProcessedId?: string | number | Record<string, any>;

  // For the currently active job (e.g., a Masa search job for one chunk)
  currentMasaJob?: MasaJobProgress | null;

  // Allows for other platform-specific state variables
  [key: string]: any;
}

// Standard Service Interface for platform-specific search services
export interface IPlatformSearchService<
  TItem = any,
  TPlatformOptions = Record<string, unknown>,
  // TPlatformState now extends the new generic PlatformState
  TPlatformState extends PlatformState = PlatformState,
> {
  initialize?(config?: any): Promise<void>;
  search(
    options: TPlatformOptions,
    // currentState now uses the generic LastProcessedState with TPlatformState
    currentState: LastProcessedState<TPlatformState> | null,
  ): Promise<{ items: TItem[]; nextStateData: TPlatformState | null }>;
  shutdown?(): Promise<void>; // Added for service cleanup
}
