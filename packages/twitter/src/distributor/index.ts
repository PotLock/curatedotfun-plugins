import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";

interface TwitterDistributorConfig {
  [key: string]: string | undefined;
}

export default class TwitterDistributorPlugin
  implements DistributorPlugin<string, TwitterDistributorConfig> {
  readonly type = "distributor" as const;

  async initialize(config?: TwitterDistributorConfig): Promise<void> {

  }

  async distribute({
    input: content,
  }: ActionArgs<string, TwitterDistributorConfig>): Promise<void> {

  }
}