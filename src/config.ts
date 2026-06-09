export interface RuntimeConfig {
  apiBaseUrl?: string;
  apiBasicAuthUser?: string;
  apiBasicAuthPassword?: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

function runtimeConfig(): RuntimeConfig {
  return window.__RUNTIME_CONFIG__ ?? {};
}

export function getApiBaseUrl(): string {
  const { apiBaseUrl } = runtimeConfig();
  if (apiBaseUrl !== undefined) return apiBaseUrl;
  return import.meta.env.VITE_API_BASE_URL || '';
}

export function getBasicAuthCredentials(): { user: string; password: string } {
  const { apiBasicAuthUser, apiBasicAuthPassword } = runtimeConfig();
  if (apiBasicAuthUser !== undefined || apiBasicAuthPassword !== undefined) {
    return {
      user: apiBasicAuthUser ?? '',
      password: apiBasicAuthPassword ?? '',
    };
  }
  return {
    user: import.meta.env.VITE_API_BASIC_AUTH_USER || '',
    password: import.meta.env.VITE_API_BASIC_AUTH_PASSWORD || '',
  };
}

export function getApiPrefix(): string {
  return `${getApiBaseUrl()}/fluvio/api`;
}

export function isMockMode(): boolean {
  return import.meta.env.VITE_MOCK_MODE === 'true';
}

export function useHashRouter(): boolean {
  return import.meta.env.VITE_USE_HASH_ROUTER === 'true';
}
