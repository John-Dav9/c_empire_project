// Configuration de l'URL de l'API — résolution dynamique selon l'environnement
// Priorité : window.__CEMPIRE_CONFIG__.apiBaseUrl (injecté par build-safe.js en prod)
//           > détection automatique selon l'URL du navigateur (dev)

type RuntimeConfig = {
  apiBaseUrl?: string;
};

// Étend l'interface Window pour que TypeScript accepte __CEMPIRE_CONFIG__
declare global {
  interface Window {
    __CEMPIRE_CONFIG__?: RuntimeConfig;
  }
}

/** Supprime le slash final pour éviter les doubles slashes dans les URLs construites */
function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Détermine l'URL de l'API automatiquement en dev selon le contexte du navigateur.
 * Logique :
 * - Port 4200 ou 4201 → backend sur le port 3000 (convention Angular dev server)
 * - localhost → http://localhost:3000/api
 * - 127.0.0.1 → http://127.0.0.1:3000/api
 * - Autre (prod sans config) → /api (chemin relatif, suppose un reverse proxy)
 */
function getDefaultApiBaseUrl(): string {
  const { hostname, port, protocol } = window.location;
  if (port === '4200' || port === '4201') {
    // Angular dev server → backend NestJS sur le même host, port 3000
    return `${protocol}//${hostname}:3000/api`;
  }
  if (hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  if (hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3000/api';
  }
  // En production sans config injectée → fallback chemin relatif
  return '/api';
}

// Lit la config runtime injectée par build-safe.js au moment du build Vercel
const runtimeConfig = window.__CEMPIRE_CONFIG__;
const runtimeApiBaseUrl = runtimeConfig?.apiBaseUrl;

/**
 * URL de base de l'API, calculée une seule fois au chargement du module.
 * - En production (Vercel) : valeur de API_BASE_URL injectée via build-safe.js
 * - En développement : auto-détection via getDefaultApiBaseUrl()
 */
export const API_BASE_URL = normalizeBaseUrl(
  runtimeApiBaseUrl && runtimeApiBaseUrl.trim().length > 0
    ? runtimeApiBaseUrl          // Config prod injectée → utilisée en priorité
    : getDefaultApiBaseUrl(),    // Fallback dev automatique
);

/**
 * Construit une URL complète de l'API à partir d'un chemin relatif.
 * Ex: buildApiUrl('/auth/signin') → 'https://c-empire.onrender.com/api/auth/signin'
 */
export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Extrait la racine du serveur (sans /api) pour construire les URLs de médias.
 * Ex: 'https://c-empire.onrender.com/api' → 'https://c-empire.onrender.com'
 */
function getApiHostRoot(): string {
  const resolved = new URL(API_BASE_URL, window.location.origin);
  const rootPath = resolved.pathname.replace(/\/api\/?$/, '');
  return `${resolved.origin}${rootPath}`;
}

/**
 * Construit l'URL complète d'un fichier media (image produit, avatar, etc.).
 * Gère 3 cas :
 * - Chemin vide → retourne ''
 * - URL absolue (http://, //, data:, blob:) → retournée telle quelle
 * - Chemin relatif (/uploads/...) → préfixé avec la racine du serveur backend
 */
export function buildMediaUrl(path?: string | null): string {
  if (!path) return '';
  // URL déjà absolue ou données inline → pas de transformation
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const hostRoot = getApiHostRoot();
  if (path.startsWith('/')) {
    return `${hostRoot}${path}`; // Ex: /uploads/img.jpg → https://backend.com/uploads/img.jpg
  }
  return `${hostRoot}/${path}`;
}
