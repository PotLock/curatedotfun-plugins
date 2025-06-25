import Mustache from "mustache";
import { z } from "zod";
import { format } from "date-fns";
import type { TransformerPlugin, ActionArgs } from "@curatedotfun/types";

// Default template generators
type TemplateGenerator = (formatStr?: string) => string | number;

const defaultTemplates: Record<string, TemplateGenerator> = {
  timestamp: () => {
    // Explicitly return a number
    return Number(Date.now());
  },
  date: (formatStr = "yyyy-MM-dd") => {
    try {
      return format(new Date(), formatStr || "yyyy-MM-dd");
    } catch (error) {
      console.error(`Error formatting date with format "${formatStr}":`, error);
      return format(new Date(), "yyyy-MM-dd");
    }
  },
  time: (formatStr = "HH:mm:ss") => {
    try {
      return format(new Date(), formatStr || "HH:mm:ss");
    } catch (error) {
      console.error(`Error formatting time with format "${formatStr}":`, error);
      return format(new Date(), "HH:mm:ss");
    }
  },
};

// Schema for the configuration
const MappingValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([z.string(), z.array(z.string()), z.record(MappingValueSchema)]),
);

const ConfigSchema = z.object({
  mappings: z.record(MappingValueSchema),
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

    // Inject default templates into input data
    const enhancedInput = this.injectDefaultTemplates(input);
    const output: Record<string, unknown> = {};

    // Recursive function to process mappings, including nested objects
    const processMapping = (
      template: string | string[] | Record<string, unknown>,
      inputData: Record<string, unknown>,
    ): unknown => {
      // Helper function to process template value
      const processTemplate = (template: string) => {
        const originalEscape = Mustache.escape;
        Mustache.escape = (text) => text;
        const rendered = Mustache.render(template, inputData);
        Mustache.escape = originalEscape;

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
      output[outputField] = processMapping(template, enhancedInput);
    }

    return output;
  }

  // Inject default templates into input data
  private injectDefaultTemplates(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...input };

    // Find all template patterns in the mappings
    const templatePatterns: Map<string, string> = new Map();

    const findTemplates = (value: any) => {
      if (typeof value === "string") {
        // Extract all {{template}} or {{template:format}} patterns
        const matches = value.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const templateContent = match.substring(2, match.length - 2);
            // Store the full template content
            templatePatterns.set(
              templateContent.toLowerCase(),
              templateContent,
            );
          });
        }
      } else if (Array.isArray(value)) {
        value.forEach((item) => findTemplates(item));
      } else if (typeof value === "object" && value !== null) {
        Object.values(value).forEach((item) => findTemplates(item));
      }
    };

    // Find all templates used in mappings
    findTemplates(this.config?.mappings);

    // Process each template pattern
    templatePatterns.forEach((originalPattern, lowerCasePattern) => {
      // Split by colon to handle format specifiers
      const colonIndex = originalPattern.indexOf(":");
      const templateName =
        colonIndex > -1
          ? originalPattern.substring(0, colonIndex)
          : originalPattern;
      const formatStr =
        colonIndex > -1 ? originalPattern.substring(colonIndex + 1) : undefined;

      const lowerCaseTemplateName = templateName.toLowerCase();

      // Check if this is a default template
      if (defaultTemplates[lowerCaseTemplateName]) {
        try {
          // Generate the value with optional format
          let value = defaultTemplates[lowerCaseTemplateName](formatStr);

          // Ensure timestamp is a number
          if (
            lowerCaseTemplateName === "timestamp" &&
            typeof value === "string"
          ) {
            value = Number(value);
          }

          // Store the value using the original template name (preserving case)
          result[templateName] = value;
        } catch (error) {
          console.error(
            `Error generating value for template "${templateName}":`,
            error,
          );
        }
      }
    });

    return result;
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
