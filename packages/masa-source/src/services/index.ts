import {
  IPlatformSearchService,
  PlatformState,
  SourceItem,
  SourcePluginSearchOptions,
} from "@curatedotfun/types";
import { z } from "zod";
import { MasaClient } from "../masa-client";
import { twitterService } from "./twitter";

// Interface for platform-specific configuration (schema and argument preparation)
export interface PlatformConfig<
  TPlatformOptionsInput extends Record<string, any> = Record<string, any>,
  TPlatformOptionsOutput extends Record<string, any> = Record<string, any>,
> {
  optionsSchema: z.ZodSchema<
    TPlatformOptionsOutput,
    any,
    TPlatformOptionsInput
  >;
  preparePlatformArgs: (
    options: SourcePluginSearchOptions,
  ) => TPlatformOptionsInput;
}

// Interface for entries in the service registry
export interface ServiceRegistryEntry<
  TItem extends SourceItem,
  TPlatformOptionsInput extends Record<string, any> = Record<string, any>,
  TPlatformOptionsOutput extends Record<string, any> = Record<string, any>,
  TPlatformState extends PlatformState = PlatformState,
> {
  platformType: string;
  factory: (
    masaClient: MasaClient,
  ) => IPlatformSearchService<TItem, TPlatformOptionsOutput, TPlatformState>;
  config: PlatformConfig<TPlatformOptionsInput, TPlatformOptionsOutput>;
}

// Service Registry
export const serviceRegistry: ServiceRegistryEntry<any, any, any, any>[] = [
  twitterService,
  // Add other services here
  // e.g.
  // {
  //   platformType: "another-platform",
  //   factory: (masaClient: MasaClient) => new AnotherPlatformService(masaClient),
  //   config: {
  //     optionsSchema: AnotherPlatformOptionsSchema,
  //     preparePlatformArgs: prepareAnotherPlatformArgs,
  //   }
  // }
];

export default serviceRegistry;
