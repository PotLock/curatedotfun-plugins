import Mustache from "mustache";
import { z } from "zod";
import type { TransformerPlugin, ActionArgs } from "@curatedotfun/types";

// Disable HTML escaping in Mustache
Mustache.escape = function (text) { return text; };

// Schema for the configuration
const MappingValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.array(z.string()),
    z.record(MappingValueSchema),
  ])
);

const ConfigSchema = z.object({
  mappings: z.record(MappingValueSchema),
});

type Config = z.infer<typeof ConfigSchema>;

export default class ObjectTransformer
  implements
  TransformerPlugin<Record<string, unknown>, Record<string, unknown>, Config> {
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

    // Recursive function to process mappings, including nested objects
    const processMapping = (
      template: string | string[] | Record<string, unknown>,
      inputData: Record<string, unknown>
    ): unknown => {
      // Helper function to process template value
      const processTemplate = (template: string) => {
        const rendered = Mustache.render(template, inputData);

        // If the template references a field that's an array or object, return it directly
        const fieldMatch = template.match(/^\{\{([^}]+)\}\}$/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          const value = field
            .split(".")
            .reduce((obj: any, key) => obj?.[key], inputData);
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

      // Process based on template type
      if (typeof template === "string") {
        const result = processTemplate(template);
        // For string templates, preserve empty arrays but convert undefined to empty string
        return Array.isArray(result) ? result : (result ?? "");
      } else if (Array.isArray(template)) {
        const results = template.map(processTemplate);
        return results.reduce((acc: unknown[], result) => {
          if (result === undefined || result === "") {
            return acc;
          }
          if (Array.isArray(result)) {
            result.forEach((item) => acc.push(item));
          } else {
            acc.push(result);
          }
          return acc;
        }, []);
      } else if (typeof template === "object" && template !== null) {
        // Handle nested object
        const nestedOutput: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(template)) {
          nestedOutput[key] = processMapping(value as any, inputData);
        }
        return nestedOutput;
      }

      return template;
    };

    // Process each top-level mapping
    for (const [outputField, template] of Object.entries(
      this.config.mappings,
    )) {
      output[outputField] = processMapping(template, input);
    }

    return output;
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
