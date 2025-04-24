/**
 * Core API utilities for making requests to the backend
 */

// Custom error class for API errors
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Default fetch options
const defaultOptions: RequestInit = {
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    const response = await fetch(`/api${endpoint}`, mergedOptions);

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new ApiError(
        errorData.message || `API error: ${response.status}`,
        response.status,
      );
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors or other issues
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0,
    );
  }
}

/**
 * HTTP GET request
 */
export function get<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "GET",
    ...options,
  });
}

/**
 * HTTP POST request
 */
export function post<T = any>(
  endpoint: string,
  data: any,
  options: RequestInit = {},
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * HTTP PUT request
 */
export function put<T = any>(
  endpoint: string,
  data: any,
  options: RequestInit = {},
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * HTTP DELETE request
 */
export function del<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "DELETE",
    ...options,
  });
}
