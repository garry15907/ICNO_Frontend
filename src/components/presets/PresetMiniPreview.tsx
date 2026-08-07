import { localEngineUrl, type PresetModel } from "@/services/localEngineApi";
import { PresetThumbnail } from "@/components/presets/PresetThumbnail";

/**
 * Live thumbnail of a `PresetModel` returned by the local engine.
 * Resolves engine-relative URLs and delegates rendering to the shared
 * `PresetThumbnail`, so the editor, the library and the market all draw
 * previews identically.
 */
export function PresetMiniPreview({
  preset,
  className,
}: {
  preset: PresetModel | null | undefined;
  className?: string;
}) {
  return (
    <PresetThumbnail
      className={className}
      wallpaperUrl={preset?.wallpaper_url ? localEngineUrl(preset.wallpaper_url) : null}
      icons={(preset?.icons ?? []).map((it) => ({
        imageUrl: it.image_url ? localEngineUrl(it.image_url) : null,
        x: it.x,
        y: it.y,
        size: it.size,
        showName: (it as { show_name?: boolean }).show_name,
        label: (it as { icon_name?: string }).icon_name,
        fontSize: (it as { font_size?: number }).font_size,
        fontFamily: (it as { font_family?: string }).font_family,
      }))}
    />
  );
}