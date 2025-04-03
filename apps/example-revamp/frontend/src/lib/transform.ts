/**
 * Transform operations
 */
import { post } from './api';

// Define types for transform operations
export interface TransformPlugin {
  plugin: string;
  config: Record<string, unknown>;
}

export interface TransformRequest {
  transform: TransformPlugin[];
  content: unknown;
}

export interface TransformResponse {
  output: unknown;
}

/**
 * Transform content using the configured transform plugins
 * 
 * @param transformPlugins Array of transform plugins with their configurations
 * @param content Content to transform
 * @returns Transformed content
 */
export async function transformContent(
  transformPlugins: TransformPlugin[],
  content: unknown
): Promise<unknown> {
  try {
    // Prepare the request payload
    const requestPayload: TransformRequest = {
      transform: transformPlugins,
      content,
    };

    // Make the API request
    const response = await post<TransformResponse>('/transform', requestPayload);
    
    // Return the transformed content
    return response.output;
  } catch (error) {
    console.error('Failed to transform content:', error);
    throw error;
  }
}

/**
 * Parse content as JSON if it's a string that looks like JSON
 * 
 * @param content Content to parse
 * @returns Parsed content or original content if not JSON
 */
export function parseContent(content: string): unknown {
  if (typeof content !== 'string' || !content.trim()) {
    return { content };
  }

  try {
    return JSON.parse(content);
  } catch {
    // Not JSON, use as-is
    return { content };
  }
}

/**
 * Format transformed content for display
 * 
 * @param transformedContent Transformed content
 * @returns Formatted content as string
 */
export function formatTransformedContent(transformedContent: unknown): string {
  if (typeof transformedContent === 'object' && transformedContent !== null) {
    return JSON.stringify(transformedContent, null, 2);
  }
  
  return String(transformedContent);
}
