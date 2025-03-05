import Mustache from "mustache";
import { z } from "zod";
import type { TransformerPlugin, ActionArgs } from "@curatedotfun/types";

// Schema for the configuration
const ConfigSchema = z.object({
  mappings: z.record(z.union([z.string(), z.array(z.string())])),
});

type Config = z.infer<typeof ConfigSchema>;

export default class ObjectTransformer
  implements
    TransformerPlugin<Record<string, unknown>, Record<string, unknown>, Config>
{
  readonly type = "transformer" as const;
  private config: Config | null = null;

  async initialize(config?: Config): Promise<void> {
    if (!config) {
      throw new Error("Object transformer requires configuration");
    }

    // Validate config against schema
    this.config = ConfigSchema.parse(config);
  }

  async transform({
    input,
    config,
  }: ActionArgs<Record<string, unknown>, Config>): Promise<
    Record<string, unknown>
  > {
    if (!this.config) {
      throw new Error("Object transformer not initialized");
    }

    const output: Record<string, unknown> = {};

    for (const [outputField, template] of Object.entries(
      this.config.mappings,
    )) {
      // Helper function to process template value
      const processTemplate = (template: string) => {
        const rendered = Mustache.render(template, input);

        // If the template references a field that's an array or object, return it directly
        const fieldMatch = template.match(/^\{\{([^}]+)\}\}$/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          const value = field
            .split(".")
            .reduce((obj: any, key) => obj?.[key], input);
          if (
            Array.isArray(value) ||
            (typeof value === "object" && value !== null)
          ) {
            return value;
          }
        }

        // Try parsing as JSON if it looks like an array
        if (rendered.startsWith("[") && rendered.endsWith("]")) {
          try {
            return JSON.parse(rendered);
          } catch {
            return rendered;
          }
        }

        return rendered;
      };

      // Process the template or array of templates
      if (Array.isArray(template)) {
        const results = template.map(processTemplate);
        output[outputField] = results.reduce((acc: unknown[], result) => {
          if (result === undefined || result === "") {
            return acc;
          }
          if (Array.isArray(result)) {
            return [...acc, ...result];
          }
          return [...acc, result];
        }, []);
      } else {
        const result = processTemplate(template);
        // For non-array templates, preserve empty arrays but convert undefined to empty string
        output[outputField] = Array.isArray(result) ? result : (result ?? "");
      }
    }

    return output;
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
