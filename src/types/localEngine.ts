/**
 * Types for data that lives on the user's local machine and is applied
 * to Windows via the local FastAPI engine. These may contain absolute
 * PC paths (e.g. `C:\Users\...\Desktop\...`) and MUST NOT be uploaded
 * verbatim to the cloud — see `src/types/preset.ts` for the cloud-safe
 * counterpart.
 */

export type LocalIconMapping = {
  id: string;
  icon_name: string;
  /** Absolute path to the icon image on the user's PC. */
  image_path: string;
  /** Optional hover-state image, absolute path. */
  hover_image_path?: string;
  /** Absolute target — usually a `.lnk` shortcut or executable. */
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

export type LocalOverlaySettings = {
  mode: "free" | "grid" | string;
  grid_cell_w: number;
  grid_cell_h: number;
  grid_cols: number;
};