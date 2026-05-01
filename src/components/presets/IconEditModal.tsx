import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconAsset } from "@/data/mockData";
import { Bold, Italic, FolderOpen, FileIcon, AppWindow, X, ImageIcon, RotateCcw } from "lucide-react";

const presets = [32, 48, 64, 128, 256, 512];

export function IconEditModal({ icon, onClose }: { icon: IconAsset & { mappedTo?: string }; onClose: () => void }) {
  const [w, setW] = useState(icon.size.w);
  const [h, setH] = useState(icon.size.h);
  const [lock, setLock] = useState(true);
  const [label, setLabel] = useState(icon.label);
  const [showLabel, setShowLabel] = useState(true);
  const [mapping, setMapping] = useState(icon.mappedTo);

  const setBoth = (v: number) => { setW(v); if (lock) setH(v); };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>아이콘 수정 · {label}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="image" className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="image">이미지</TabsTrigger>
            <TabsTrigger value="size">크기/위치</TabsTrigger>
            <TabsTrigger value="style">스타일</TabsTrigger>
            <TabsTrigger value="mapping">매핑</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">기본 이미지</Label>
                <div className="mt-2 aspect-square rounded-xl bg-muted grid place-items-center text-7xl border border-border">{icon.emoji}</div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="flex-1"><ImageIcon className="h-3.5 w-3.5 mr-1" />변경</Button>
                  <Button variant="ghost" size="sm"><RotateCcw className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">호버 이미지</Label>
                <div className="mt-2 aspect-square rounded-xl bg-muted grid place-items-center text-7xl border border-dashed border-border text-muted-foreground">+</div>
                <Button variant="outline" size="sm" className="w-full mt-2"><ImageIcon className="h-3.5 w-3.5 mr-1" />호버 이미지 추가</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">아이콘 이름 / 라벨</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1.5" />
            </div>
          </TabsContent>

          <TabsContent value="size" className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">가로 (px)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input type="number" value={w} onChange={(e) => setBoth(+e.target.value)} className="w-24" />
                  <Slider value={[w]} min={16} max={1024} step={1} onValueChange={(v) => setBoth(v[0])} />
                </div>
              </div>
              <div>
                <Label className="text-xs">세로 (px)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input type="number" value={h} onChange={(e) => { setH(+e.target.value); if (lock) setW(+e.target.value); }} className="w-24" />
                  <Slider value={[h]} min={16} max={1024} step={1} onValueChange={(v) => { setH(v[0]); if (lock) setW(v[0]); }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={lock} onCheckedChange={setLock} id="lock" />
              <Label htmlFor="lock" className="text-sm">가로/세로 비율 고정</Label>
            </div>
            <div>
              <Label className="text-xs">빠른 크기</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {presets.map((p) => (
                  <button key={p} onClick={() => setBoth(p)} className="px-3 py-1 rounded-md border border-border text-xs hover:border-primary">{p}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <Label className="text-xs">X 위치 (%)</Label>
                <Input type="number" defaultValue={icon.position.x} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs">Y 위치 (%)</Label>
                <Input type="number" defaultValue={icon.position.y} className="mt-1.5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">팁: 미리보기에서 아이콘을 드래그해 위치를 조정할 수 있습니다.</p>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>라벨 표시</Label>
              <Switch checked={showLabel} onCheckedChange={setShowLabel} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">폰트</Label>
                <Select defaultValue="pretendard">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pretendard">Pretendard</SelectItem>
                    <SelectItem value="noto">Noto Sans KR</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">폰트 크기</Label>
                <Input type="number" defaultValue={12} className="mt-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><Bold className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm"><Italic className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">텍스트 색상</Label>
                <Input type="color" defaultValue="#ffffff" className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">외곽선 색상</Label>
                <Input type="color" defaultValue="#000000" className="mt-1.5 h-10" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">아이콘을 내 PC의 프로그램, 파일, 폴더, 단축아이콘에 연결합니다. 매핑 정보는 로컬에만 저장되며 마켓에 업로드되지 않습니다.</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-20 flex-col gap-1"><AppWindow className="h-5 w-5" /><span className="text-xs">프로그램</span></Button>
              <Button variant="outline" className="h-20 flex-col gap-1"><FileIcon className="h-5 w-5" /><span className="text-xs">파일</span></Button>
              <Button variant="outline" className="h-20 flex-col gap-1"><FolderOpen className="h-5 w-5" /><span className="text-xs">폴더</span></Button>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">현재 연결된 대상</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border border-border flex-1 truncate">{mapping ?? "연결되지 않음"}</code>
                {mapping && <Button variant="ghost" size="sm" onClick={() => setMapping(undefined)}><X className="h-3.5 w-3.5" /></Button>}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button className="bg-gradient-primary text-primary-foreground" onClick={onClose}>저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}