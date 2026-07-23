/**
 * Cloud API client (planned).
 *
 * Placeholder for the future cloud backend that will host user accounts,
 * the public preset marketplace, downloads, likes/bookmarks, library
 * sync, reports, and creator/preset metadata.
 *
 * This file intentionally contains NO real network calls yet — the cloud
 * service does not exist. Do not fabricate endpoints, base URLs, or
 * request/response shapes here until the cloud API spec is defined.
 *
 * When the cloud service comes online, wire it up to:
 *   `VITE_CLOUD_API_BASE_URL`
 */

export const CLOUD_API_BASE_URL: string | undefined =
  (import.meta as any).env?.VITE_CLOUD_API_BASE_URL || undefined;

export const isCloudApiConfigured = () => Boolean(CLOUD_API_BASE_URL);

// TODO(cloud): auth (sign up / sign in / sign out / session refresh)
// TODO(cloud): preset upload
// TODO(cloud): preset search / discovery / detail
// TODO(cloud): preset download (returns manifest + asset URLs)
// TODO(cloud): likes / bookmarks
// TODO(cloud): user library sync
// TODO(cloud): reporting + visibility (public/private) management
// TODO(cloud): creator profile + preset metadata