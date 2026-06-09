export interface ApiError extends Error {
  status?: number;
  info?: { error?: string; message?: string } | string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_PREFIX = `${BASE_URL}/fluvio/api`;

const BASIC_AUTH_USER = import.meta.env.VITE_API_BASIC_AUTH_USER || '';
const BASIC_AUTH_PASSWORD = import.meta.env.VITE_API_BASIC_AUTH_PASSWORD || '';

function getAuthHeaders(): Record<string, string> {
  if (BASIC_AUTH_USER && BASIC_AUTH_PASSWORD) {
    const credentials = btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`);
    return { Authorization: `Basic ${credentials}` };
  }
  return {};
}

/** Extract a human-readable message from an API error payload. */
export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!error || typeof error !== 'object') return fallback;
  const apiError = error as ApiError;
  if (typeof apiError.info === 'string') return apiError.info;
  if (apiError.info && typeof apiError.info === 'object') {
    return apiError.info.error ?? apiError.info.message ?? apiError.message ?? fallback;
  }
  return apiError.message ?? fallback;
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
    error.message = getApiErrorMessage(error);
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
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  return handleResponse<T>(response);
}
