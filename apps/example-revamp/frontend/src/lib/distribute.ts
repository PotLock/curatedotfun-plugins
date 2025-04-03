/**
 * Distribution operations
 */
import { post } from './api';

// Define types for distribution operations
export interface DistributePlugin {
  plugin: string;
  config: Record<string, unknown>;
}

export interface DistributeRequest {
  distribute: DistributePlugin[];
  content: unknown;
}

export interface DistributeResponse {
  results: DistributeResult[];
}

export interface DistributeResult {
  plugin: string;
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Distribute content using the configured distribution plugins
 * 
 * @param distributePlugins Array of distribution plugins with their configurations
 * @param content Content to distribute
 * @returns Distribution results
 */
export async function distributeContent(
  distributePlugins: DistributePlugin[],
  content: unknown
): Promise<DistributeResult[]> {
  try {
    // Prepare the request payload
    const requestPayload: DistributeRequest = {
      distribute: distributePlugins,
      content,
    };

    // Make the API request
    const response = await post<DistributeResponse>('/distribute', requestPayload);
    
    // Return the distribution results
    return response.results;
  } catch (error) {
    console.error('Failed to distribute content:', error);
    throw error;
  }
}

/**
 * Format distribution results for display
 * 
 * @param results Distribution results
 * @returns Formatted results as string
 */
export function formatDistributionResults(results: DistributeResult[]): string {
  return results.map(result => {
    const status = result.success ? '✅' : '❌';
    const message = result.success 
      ? result.message || 'Success' 
      : result.error || 'Failed';
    
    return `${status} ${result.plugin}: ${message}`;
  }).join('\n');
}
