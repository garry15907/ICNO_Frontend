/**
 * Local Engine API client (FastAPI running on the user's PC).
 *
 * This is NOT a cloud service — it talks to the ICNO Desktop engine that
 * runs on `http://127.0.0.1:8000` by default. Base URL comes from the
 * `VITE_LOCAL_ENGINE_API` env var.
 *
 * Every path, HTTP method, request body and response shape defined here
 * MUST match the FastAPI OpenAPI spec that ships with the desktop app.
 * Do NOT introduce new endpoints or rename fields without regenerating
 * the backend spec.
 *
 * Cloud endpoints (auth, preset marketplace, downloads, likes, etc.) do
 * not belong in this file — see `src/services/cloudApi.ts`.
 */

export const LOCAL_ENGINE_BASE_URL: string = (
  (import.meta as any).env?.VITE_LOCAL_ENGINE_API ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

// ── Types (mirrors of the FastAPI Pydantic models) ─────────────────────

export type IconMappingCreate = {
  icon_name: string;
  image_path: string;
  hover_image_path?: string;
  target_path?: string;
  x?: number;
  y?: number;
  size?: number;
  show_name?: boolean;
  font_family?: string;
  font_size?: number;
  font_bold?: boolean;
  font_italic?: boolean;
  font_color?: string;
  outline_color?: string;
};

export type IconMappingUpdate = Partial<{
  name: string;
  image_path: string;
  hover_image_path: string;
  target_path: string;
  size: number;
  show_name: boolean;
  font_family: string;
  font_size: number;
  font_bold: boolean;
  font_italic: boolean;
  font_color: string;
  outline_color: string;
}>;

export type IconMapping = {
  id: string;
  name?: string;
  icon_name?: string;
  image_path?: string;
  hover_image_path?: string;
  target_path?: string;
  x?: number;
  y?: number;
  size?: number;
  show_name?: boolean;
  font_family?: string;
  font_size?: number;
  font_bold?: boolean;
  font_italic?: boolean;
  font_color?: string;
  outline_color?: string;
  [k: string]: unknown;
};

export type CustomImage = {
  filename: string;
  path: string;
  url: string;
  [k: string]: unknown;
};

export type DesktopIcon = {
  name: string;
  path?: string;
  icon_url?: string;
  [k: string]: unknown;
};

export type SettingsModel = {
  mode: "free" | "grid" | string;
  grid_cell_w: number;
  grid_cell_h: number;
  grid_cols: number;
};

// ── Core request helper ────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${LOCAL_ENGINE_BASE_URL}${path}`;
  const method = (init.method ?? "GET").toUpperCase();
  let body = init.body as BodyInit | null | undefined;
  const headers = new Headers(init.headers);
  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof URLSearchParams)
  ) {
    body = JSON.stringify(body);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  if ((import.meta as any).env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[local-engine] -> ${method} ${url}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, method, body, headers });
  } catch (err: any) {
    console.error(`[local-engine] x ${method} ${url} - network error`, err);
    throw new ApiError(err?.message ?? "Network error", 0);
  }

  const ct = res.headers.get("content-type") ?? "";
  const parseBody = async () => {
    if (!ct.includes("application/json")) return await res.text();
    try { return await res.json(); } catch { return null; }
  };

  if (!res.ok) {
    const errBody = await parseBody();
    console.error(`[local-engine] x ${method} ${url} - ${res.status}`, errBody);
    throw new ApiError(`Request failed: ${method} ${path} (${res.status})`, res.status, errBody);
  }

  if ((import.meta as any).env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[local-engine] ok ${method} ${url} - ${res.status}`);
  }
  return (await parseBody()) as T;
}

// ── Icons ──────────────────────────────────────────────────────────────

/** GET /api/icons/desktop */
export function getDesktopIcons(): Promise<{ icons?: DesktopIcon[] } & Record<string, any>> {
  return request("/api/icons/desktop");
}

/** GET /api/icons/images */
export function getCustomImages(): Promise<{ images?: CustomImage[] } & Record<string, any>> {
  return request("/api/icons/images");
}

/** POST /api/icons/upload (multipart) */
export function uploadIconImage(
  file: File,
): Promise<{ success?: boolean; filename?: string; path?: string; url?: string } & Record<string, any>> {
  const fd = new FormData();
  fd.append("file", file);
  return request("/api/icons/upload", { method: "POST", body: fd });
}

/** GET /api/icons/mappings */
export function getIconMappings(): Promise<{ mappings?: IconMapping[] } & Record<string, any>> {
  return request("/api/icons/mappings");
}

/** POST /api/icons/mapping */
export function createIconMapping(payload: IconMappingCreate): Promise<any> {
  return request("/api/icons/mapping", { method: "POST", body: payload as any });
}

/** PATCH /api/icons/mapping/{icon_id} */
export function updateIconMapping(iconId: string, payload: IconMappingUpdate): Promise<any> {
  return request(`/api/icons/mapping/${encodeURIComponent(iconId)}`, {
    method: "PATCH",
    body: payload as any,
  });
}

/** DELETE /api/icons/mapping/{icon_id} */
export function deleteIconMapping(iconId: string): Promise<any> {
  return request(`/api/icons/mapping/${encodeURIComponent(iconId)}`, { method: "DELETE" });
}

export function hideDesktopIcons(): Promise<any> {
  return request("/api/icons/hide-desktop", { method: "POST" });
}
export function showDesktopIcons(): Promise<any> {
  return request("/api/icons/show-desktop", { method: "POST" });
}
export function arrangeGrid(): Promise<any> {
  return request("/api/icons/arrange-grid", { method: "POST" });
}
export function getOverlayStatus(): Promise<any> {
  return request("/api/icons/overlay-status");
}
export function reloadOverlay(): Promise<any> {
  return request("/api/icons/reload-overlay", { method: "POST" });
}
export function startOverlay(): Promise<any> {
  return request("/api/icons/start-overlay", { method: "POST" });
}
export function launchApplyWindow(): Promise<any> {
  return request("/api/icons/launch-apply-window", { method: "POST" });
}
export function pickTargetFile(): Promise<any> {
  return request("/api/icons/pick-file");
}

// ── Settings ───────────────────────────────────────────────────────────

export function getSettings(): Promise<SettingsModel> {
  return request("/api/settings");
}
export function saveSettings(payload: SettingsModel): Promise<any> {
  return request("/api/settings", { method: "POST", body: payload as any });
}

// ── Misc ───────────────────────────────────────────────────────────────

export function launchLauncher(): Promise<any> {
  return request("/api/launch-launcher", { method: "POST" });
}
export function calculate(expression: string): Promise<any> {
  return request("/api/calculate", { method: "POST", body: { expression } as any });
}

/** Prefix a local-engine relative URL (e.g. `/custom_icons/foo.png`) with the engine base. */
export function localEngineUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${LOCAL_ENGINE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Backwards-compatible alias (older code imported `apiUrl` from `@/services/api`).
export const apiUrl = localEngineUrl;
export const API_BASE_URL = LOCAL_ENGINE_BASE_URL;