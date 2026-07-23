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