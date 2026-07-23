/**
 * Cloud-shareable preset types.
 *
 * These describe presets that will eventually be uploaded to the cloud
 * marketplace. They MUST NOT include user-specific absolute paths such
 * as `C:\Users\<name>\Desktop\...` or `C:\Program Files\...`.
 *
 * Real cloud upload/download conversion is not implemented yet.
 */

export type CloudLogicalTarget = {
  logical_target: string;
  display_name: string;
  executable_name?: string;
};

export type CloudIconEntry = {
  icon_name: string;
  image_url: string;
  hover_image_url?: string;
  target?: CloudLogicalTarget;
  x?: number;
  y?: number;
  size?: number;
  show_name?: boolean;
};

export type CloudPresetManifest = {
  id: string;
  name: string;
  author?: { id: string; display_name: string };
  wallpaper_url?: string;
  icons: CloudIconEntry[];
  // TODO(cloud): tags, category, resolution metadata, pricing, license, etc.
};

// TODO(cloud): implement `toCloudManifest(local: LocalIconMapping[]): CloudPresetManifest`
// TODO(cloud): implement `fromCloudManifest(m: CloudPresetManifest): LocalIconMapping[]`
*** Add File: .env.local.example
# Local FastAPI icon engine (runs on the user's PC).
# Copy this file to `.env.local` and adjust if your engine listens on a different port.
VITE_LOCAL_ENGINE_API=http://127.0.0.1:8000

# Future cloud backend (not implemented yet — leave empty for now).
VITE_CLOUD_API_BASE_URL=