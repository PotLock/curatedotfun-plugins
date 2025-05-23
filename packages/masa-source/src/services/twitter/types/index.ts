import { PlatformState } from "@curatedotfun/types";
import { z } from "zod";

// Corresponds to TPlatformState for TwitterSearchService, extending the generic PlatformState
export interface TwitterPlatformState extends PlatformState {
  // 'latestProcessedId' from PlatformState will be used as newestTweetIdProcessed (string for Twitter ID).
  // 'currentMasaJob' from PlatformState will be used to track Masa job progress.
  // If you need to paginate backwards or have other Twitter-specific state, add here:
  // e.g., oldestTweetIdProcessed?: string;
}

export const TwitterQueryOptionsSchema = z
  .object({
    allWords: z.string().optional(),
    exactPhrase: z.string().optional(),
    anyWords: z.string().optional(),
    noneWords: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    fromAccounts: z.array(z.string()).optional(),
    toAccounts: z.array(z.string()).optional(),
    mentioningAccounts: z.array(z.string()).optional(),
    includeReplies: z.boolean().optional(),
    onlyReplies: z.boolean().optional(),
    onlyLinks: z.boolean().optional(),
    minReplies: z.number().int().positive().optional(),
    minLikes: z.number().int().positive().optional(),
    minRetweets: z.number().int().positive().optional(),
    sinceDate: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
      .optional(),
    untilDate: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
      .optional(),
    sinceId: z.string().optional(),
    pageSize: z.number().int().positive().optional(),
    language: z.string().optional(),
  })
  .strict();

export type TwitterQueryOptionsInput = z.input<
  typeof TwitterQueryOptionsSchema
>;
export type TwitterQueryOptionsOutput = z.output<
  typeof TwitterQueryOptionsSchema
>;
