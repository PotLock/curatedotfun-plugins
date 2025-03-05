import { describe, it, expect, beforeEach } from "vitest";
import ObjectTransformer from "../index";

describe("ObjectTransformer", () => {
  let transformer: ObjectTransformer;

  beforeEach(() => {
    transformer = new ObjectTransformer();
  });

  it("should throw error if not initialized", async () => {
    await expect(transformer.transform({ input: {} })).rejects.toThrow(
      "Object transformer not initialized",
    );
  });

  it("should throw error if initialized without config", async () => {
    await expect(transformer.initialize()).rejects.toThrow(
      "Object transformer requires configuration",
    );
  });

  it("should handle simple string mappings", async () => {
    await transformer.initialize({
      mappings: {
        title: "{{name}}",
        description: "A {{type}} project",
      },
    });

    const result = await transformer.transform({
      input: {
        name: "Test Project",
        type: "web",
      },
    });

    expect(result).toEqual({
      title: "Test Project",
      description: "A web project",
    });
  });

  it("should handle array fields in input", async () => {
    await transformer.initialize({
      mappings: {
        // Direct array usage
        categories: "{{tags}}",
        // Static array with embedded array
        mixedCategories: ["near", "{{tags}}"],
        // Multiple arrays combined
        allCategories: ["web", "{{tags}}", "{{moreTags}}"],
      },
    });

    const result = await transformer.transform({
      input: {
        tags: ["javascript", "typescript"],
        moreTags: ["react", "node"],
      },
    });

    expect(result).toEqual({
      categories: ["javascript", "typescript"],
      mixedCategories: ["near", "javascript", "typescript"],
      allCategories: ["web", "javascript", "typescript", "react", "node"],
    });
  });

  it("should handle array templates with non-array values", async () => {
    await transformer.initialize({
      mappings: {
        tags: ["tag:{{category}}", "type:{{type}}"],
      },
    });

    const result = await transformer.transform({
      input: {
        category: "blog",
        type: "article",
      },
    });

    expect(result).toEqual({
      tags: ["tag:blog", "type:article"],
    });
  });

  it("should handle empty or missing values", async () => {
    await transformer.initialize({
      mappings: {
        title: "{{title}}",
        tags: "{{tags}}",
        categories: ["fixed", "{{categories}}"],
      },
    });

    const result = await transformer.transform({
      input: {
        title: "",
        tags: [],
        // categories is undefined
      },
    });

    expect(result).toEqual({
      title: "",
      tags: [],
      categories: ["fixed"],
    });
  });

  it("should handle nested objects in arrays", async () => {
    await transformer.initialize({
      mappings: {
        authors: "{{contributors}}",
        firstAuthor: "{{contributors.0.name}}",
        roles: ["admin", "{{roles}}"],
      },
    });

    const result = await transformer.transform({
      input: {
        contributors: [
          { name: "John", role: "developer" },
          { name: "Jane", role: "designer" },
        ],
        roles: ["editor", "reviewer"],
      },
    });

    expect(result).toEqual({
      authors: [
        { name: "John", role: "developer" },
        { name: "Jane", role: "designer" },
      ],
      firstAuthor: "John",
      roles: ["admin", "editor", "reviewer"],
    });
  });

  it("should handle invalid JSON in array strings", async () => {
    await transformer.initialize({
      mappings: {
        test: "{{invalidArray}}",
        array: ["{{invalidArray}}"],
      },
    });

    const result = await transformer.transform({
      input: {
        invalidArray: "[not valid json]",
      },
    });

    expect(result).toEqual({
      test: "[not valid json]",
      array: ["[not valid json]"],
    });
  });
});
