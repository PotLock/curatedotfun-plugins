import {
  IPlatformSearchService,
  SourcePluginSearchOptions,
} from "@curatedotfun/types";
import { MasaClient, MasaSearchResult } from "src/masa-client";
import { TwitterSearchService } from "./service";
import {
  TwitterPlatformState,
  TwitterQueryOptionsInput,
  TwitterQueryOptionsOutput,
  TwitterQueryOptionsSchema,
} from "./types";

const prepareTwitterArgs = (
  options: SourcePluginSearchOptions,
): TwitterQueryOptionsInput => {
  const { query: baseQuery, pageSize, ...platformSpecificOptions } = options;

  const rawOptions: TwitterQueryOptionsInput = {
    ...(platformSpecificOptions.platformArgs as Partial<TwitterQueryOptionsInput>),
    ...(baseQuery &&
      !(
        platformSpecificOptions.platformArgs as Partial<TwitterQueryOptionsInput>
      )?.allWords && { allWords: baseQuery }),
    ...(pageSize &&
      !(
        platformSpecificOptions.platformArgs as Partial<TwitterQueryOptionsInput>
      )?.pageSize && { pageSize: pageSize }),
  };

  if (rawOptions.pageSize === undefined) {
    delete rawOptions.pageSize;
  }
  if (platformSpecificOptions.language) {
    rawOptions.language = platformSpecificOptions.language as string;
  }

  return rawOptions;
};

export const twitterService = {
  platformType: "twitter-scraper",
  factory: (masaClient: MasaClient) =>
    new TwitterSearchService(masaClient) as IPlatformSearchService<
      MasaSearchResult,
      TwitterQueryOptionsOutput,
      TwitterPlatformState
    >,
  config: {
    optionsSchema: TwitterQueryOptionsSchema,
    preparePlatformArgs: prepareTwitterArgs,
  },
};
