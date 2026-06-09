export interface ApiError extends Error {
  status?: number;
  info?: { error?: string; message?: string } | string;
}

import { getApiPrefix, getBasicAuthCredentials, isMockMode } from '../config';
import { mockRequest } from '../mock/api';

function getAuthHeaders(): Record<string, string> {
  const { user, password } = getBasicAuthCredentials();
  if (user && password) {
    const credentials = btoa(`${user}:${password}`);
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
  if (isMockMode()) {
    return mockRequest<T>(path, options);
  }

  const url = `${getApiPrefix()}${path}`;

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
