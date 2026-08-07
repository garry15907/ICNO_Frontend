import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { PresetModel } from "@/services/localEngineApi";
import { LIMITS, parseTags, uploadPresetToMarket } from "@/services/marketPresetUpload";

export function MarketUploadModal({
  preset,
  open,
  onOpenChange,
  onUploaded,
}: {
  preset: PresetModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(preset?.name ?? "");
      setDescription("");
      setTagsRaw("");
      setIsPublic(true);
      setBusy(false);
    }
  }, [open, preset?.name]);

  const tags = parseTags(tagsRaw);
  const iconCount = (preset?.icons ?? []).filter((i) => !!i.image_url).length;

  const handleUpload = async () => {
    if (!preset) return;
    setBusy(true);
    try {
      const res = await uploadPresetToMarket({ preset, name, description, tagsRaw, isPublic });
      toast({
        title: "마켓에 올렸습니다",
        description: `${res.name} · ${isPublic ? "공개" : "비공개"}로 등록되었습니다.`,
      });
      onOpenChange(false);
      onUploaded?.();
      window.dispatchEvent(new Event("market-presets:refresh"));
    } catch (err) {
      toast({
        title: "업로드에 실패했습니다",
        description: err instanceof Error ? err.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!busy || !o ? onOpenChange(o) : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> 마켓에 올리기
          </DialogTitle>
          <DialogDescription>
            {user
              ? "프리셋의 배경화면과 아이콘 이미지, 배치 정보만 업로드됩니다."
              : "마켓에 올리려면 로그인이 필요합니다."}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              로그인하면 내가 만든 프리셋을 마켓에 공개할 수 있습니다.
            </p>
            <Button
              className="w-full bg-gradient-primary text-primary-foreground"
              onClick={() => {
                onOpenChange(false);
                nav("/auth");
              }}
            >
              <LogIn className="h-4 w-4 mr-1.5" /> 로그인 하러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mkt-name">이름</Label>
              <Input
                id="mkt-name"
                value={name}
                maxLength={LIMITS.nameMax}
                onChange={(e) => setName(e.target.value)}
                placeholder="프리셋 이름"
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {name.length}/{LIMITS.nameMax}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mkt-desc">설명 (선택)</Label>
              <Textarea
                id="mkt-desc"
                value={description}
                maxLength={LIMITS.descriptionMax}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 프리셋을 소개해주세요"
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {description.length}/{LIMITS.descriptionMax}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mkt-tags">태그 (쉼표로 구분)</Label>
              <Input
                id="mkt-tags"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="미니멀, 다크, 감성"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                태그는 최대 {LIMITS.tagCount}개, 개당 {LIMITS.tagMax}자까지입니다.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">공개하기</div>
                <div className="text-[11px] text-muted-foreground">
                  {isPublic ? "누구나 탐색에서 볼 수 있습니다" : "나만 볼 수 있습니다"}
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <p className="text-[11px] text-muted-foreground">
              배경화면 {preset?.wallpaper_url ? "1" : "0"}장 · 아이콘 {iconCount}개가 업로드됩니다.
              프로그램/파일 실행 경로는 업로드되지 않습니다.
            </p>
          </div>
        )}

        {user && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              취소
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleUpload}
              disabled={busy || !name.trim()}
            >
              {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Store className="h-4 w-4 mr-1.5" />}
              올리기
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}