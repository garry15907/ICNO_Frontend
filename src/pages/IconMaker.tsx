import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ImageIcon, Save, Plus, Store, Monitor } from "lucide-react";

export default function IconMaker() {
  const [w, setW] = useState(128);
  const [h, setH] = useState(128);
  const [lock, setLock] = useState(true);
  const [radius, setRadius] = useState(16);
  const [transparent, setTransparent] = useState(true);
  const [shadow, setShadow] = useState(false);

  const setBoth = (v: number) => { setW(v); if (lock) setH(v); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">아이콘 제작 / 변환</h2>
        <p className="text-muted-foreground mt-1">이미지를 업로드하여 아이콘 자산을 만들고 내보냅니다. (PNG · JPG · GIF · SVG · ICO)</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Preview area */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <Label className="text-xs">원본 이미지</Label>
              <div className="mt-2 aspect-square rounded-xl border-2 border-dashed border-border bg-muted/40 grid place-items-center text-muted-foreground hover:border-primary cursor-pointer">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">이미지 업로드</div>
                  <div className="text-xs mt-1">PNG, JPG, GIF, SVG, ICO</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <Label className="text-xs">변환 미리보기</Label>
              <div
                className="mt-2 aspect-square grid place-items-center text-7xl"
                style={{
                  background: transparent
                    ? "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 20px 20px"
                    : "hsl(var(--muted))",
                  borderRadius: radius,
                  boxShadow: shadow ? "0 8px 24px rgba(0,0,0,0.3)" : "none",
                }}
              >
                🎨
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">{w} × {h} px</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button className="bg-gradient-primary text-primary-foreground"><Save className="h-4 w-4 mr-2" />보관함 저장</Button>
            <Button variant="outline"><Plus className="h-4 w-4 mr-2" />현재 프리셋에 추가</Button>
            <Button variant="outline"><Store className="h-4 w-4 mr-2" />마켓 업로드</Button>
            <Button variant="outline"><Monitor className="h-4 w-4 mr-2" />Windows 적용</Button>
          </div>
        </div>

        {/* Controls */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">기본 정보</div>
            <div>
              <Label className="text-xs">아이콘 이름</Label>
              <Input className="mt-1.5" placeholder="my-icon" />
            </div>
            <div>
              <Label className="text-xs">내보내기 형식</Label>
              <Select defaultValue="PNG">
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PNG">PNG</SelectItem>
                  <SelectItem value="SVG">SVG</SelectItem>
                  <SelectItem value="ICO">ICO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">크기</div>
            <div>
              <Label className="text-xs">가로 (px)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input type="number" value={w} onChange={(e) => setBoth(+e.target.value)} className="w-20" />
                <Slider value={[w]} min={16} max={1024} step={1} onValueChange={(v) => setBoth(v[0])} />
              </div>
            </div>
            <div>
              <Label className="text-xs">세로 (px)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input type="number" value={h} onChange={(e) => { setH(+e.target.value); if (lock) setW(+e.target.value); }} className="w-20" />
                <Slider value={[h]} min={16} max={1024} step={1} onValueChange={(v) => { setH(v[0]); if (lock) setW(v[0]); }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={lock} onCheckedChange={setLock} id="aspect" />
              <Label htmlFor="aspect" className="text-sm">비율 고정</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[32,48,64,128,256,512].map((p) => (
                <button key={p} onClick={() => setBoth(p)} className="px-2.5 py-1 rounded-md border border-border text-xs hover:border-primary">{p}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">스타일</div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">투명 배경</Label>
              <Switch checked={transparent} onCheckedChange={setTransparent} />
            </div>
            <div>
              <Label className="text-xs">모서리 둥글기 ({radius}px)</Label>
              <Slider value={[radius]} min={0} max={64} onValueChange={(v) => setRadius(v[0])} className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">그림자</Label>
              <Switch checked={shadow} onCheckedChange={setShadow} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">테두리</Label>
              <Switch />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}