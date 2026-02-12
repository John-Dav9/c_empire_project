type RuntimeConfig = {
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    __CEMPIRE_CONFIG__?: RuntimeConfig;
  }
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function getDefaultApiBaseUrl(): string {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  if (hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3000/api';
  }
  return '/api';
}

const runtimeConfig = window.__CEMPIRE_CONFIG__;
const runtimeApiBaseUrl = runtimeConfig?.apiBaseUrl;

export const API_BASE_URL = normalizeBaseUrl(
  runtimeApiBaseUrl && runtimeApiBaseUrl.trim().length > 0
    ? runtimeApiBaseUrl
    : getDefaultApiBaseUrl(),
);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
