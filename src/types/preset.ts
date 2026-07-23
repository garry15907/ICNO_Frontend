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

// TODO(cloud): implement toCloudManifest / fromCloudManifest converters
// that scrub absolute Windows paths when uploading and re-resolve them
// when downloading on a new machine.

// =====================================================================
// Preset icon asset reference (used inside the preset editor).
//
// Every icon placed on the canvas keeps enough metadata to (a) render a
// preview even when the underlying `File` object no longer exists in
// memory (e.g. after reopening a saved preset), (b) reconnect to the
// user's icon library so re-opens don't fall back to a placeholder,
// and (c) later resolve into either a local FastAPI `image_path` or a
// cloud asset id when the apply-local endpoint is implemented.
//
// Absolute Windows paths that live in `local_image_path` MUST NOT be
// uploaded to the cloud — see the cloud manifest types above.
// =====================================================================

export type IconAssetSource =
  | "user-upload"       // user's local file upload for this preset
  | "library"           // stand-alone icon in "내 아이콘 보관함"
  | "iconpack"          // icon that came from a downloaded icon pack
  | "local-engine"      // already-uploaded file known to local FastAPI
  | "cloud-library";    // cloud-only asset, not yet downloaded

export type PresetIconRef = {
  /** Stable reference used across sessions. For library assets this is
   *  the `UserIconAsset.id`; for freshly uploaded files it is the local
   *  IconAsset id.  Preserved verbatim on save/load. */
  asset_id: string;
  asset_source: IconAssetSource;
  /** URL-safe preview (blob:, data:, or http(s):) used only for UI. */
  preview_url?: string;
  /** Path returned by the local FastAPI once the file has been uploaded
   *  to the engine (`POST /api/icons/upload`). Reused to avoid double
   *  uploads. */
  local_image_path?: string;
  hover_image_path?: string;
  /** Future cloud-library binding — kept optional so the shape is ready
   *  when the cloud API lands. */
  cloud_asset_id?: string;
  download_status?: "downloaded" | "not-downloaded";
};