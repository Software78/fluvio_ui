export interface ApiError extends Error {
  status?: number;
  info?: { message?: string } | string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_PREFIX = `${BASE_URL}/fluvio/api`;

function parseTotalCountHeader(response: Response): number | undefined {
  const value = response.headers.get('X-Total-Count');
  if (!value) return undefined;
  const total = Number.parseInt(value, 10);
  return Number.isFinite(total) ? total : undefined;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = new Error('API Request Failed');
    error.status = response.status;

    try {
      error.info = await response.json();
    } catch (_) {
      try {
        error.info = await response.text();
      } catch (_) {
        error.info = 'Unknown API error';
      }
    }
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Generic request wrapper for Fluvio REST API.
 */
export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_PREFIX}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  return handleResponse<T>(response);
}

/**
 * Like request(), but also surfaces pagination total from headers or body metadata.
 */
export async function requestWithTotal<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T; total?: number }> {
  const url = `${API_PREFIX}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const total = parseTotalCountHeader(response);
  const data = await handleResponse<T>(response);

  return { data, total };
}
