import type { ActionArgs } from "@curatedotfun/types";
import { SourcePlugin } from "./../../../types/src/index";

interface TwitterSourceConfig {
  [key: string]: string | undefined;
}

export default class TwitterSourcePlugin
  implements SourcePlugin<string, TwitterSourceConfig>
{
  readonly type = "source" as const;

  async initialize(config?: TwitterSourceConfig): Promise<void> {}

  async collect({
    input: content,
  }: ActionArgs<string, TwitterSourceConfig>): Promise<void> {}
}
