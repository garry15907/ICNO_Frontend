import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, ImageIcon, Lock, ShieldCheck } from "lucide-react";

const types = [
  { id: "preset", label: "데스크톱 프리셋", desc: "배경화면 + 아이콘 세트" },
  { id: "iconpack", label: "아이콘 팩", desc: "여러 아이콘 묶음" },
  { id: "icon", label: "단일 아이콘", desc: "단독 아이콘 1개" },
] as const;

export default function Upload() {
  const [type, setType] = useState<(typeof types)[number]["id"]>("preset");
  const [paid, setPaid] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">업로드 / 판매 등록</h2>
        <p className="text-muted-foreground mt-1">내가 만든 프리셋을 마켓플레이스에 공유하거나 판매하세요.</p>
      </div>

      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">로컬 매핑 정보는 자동으로 제거됩니다</div>
          <div className="text-xs text-muted-foreground mt-0.5">대상 프로그램, 파일, 폴더, 단축아이콘 경로 등 PC 정보는 마켓에 업로드되지 않습니다.</div>
        </div>
      </div>

      {/* Type */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">상품 유형</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                type === t.id ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-xs">배경화면 업로드</Label>
            <div className="mt-1.5 aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary bg-muted/30 grid place-items-center cursor-pointer transition">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm font-medium">배경화면 이미지를 끌어다 놓거나 클릭하여 업로드</div>
                <div className="text-xs mt-1">PNG, JPG · 최대 4K</div>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">아이콘 세트 업로드</Label>
            <div className="mt-1.5 rounded-xl border-2 border-dashed border-border hover:border-primary bg-muted/30 p-6 cursor-pointer transition text-center">
              <UploadIcon className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm">아이콘 이미지 여러 개를 한 번에 업로드</div>
              <div className="text-xs text-muted-foreground mt-1">PNG / SVG / ICO</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">프리셋 이름</Label>
            <Input className="mt-1.5" placeholder="예: 노을, 픽셀 게임룸" />
          </div>
          <div>
            <Label className="text-xs">설명</Label>
            <Textarea className="mt-1.5 min-h-24" placeholder="프리셋의 컨셉과 분위기를 설명하세요." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">카테고리</Label>
              <Select defaultValue="자연">
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["자연","캐릭터","다크","미니멀","게임","파스텔","사이버펑크"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">태그 (콤마)</Label>
              <Input className="mt-1.5" placeholder="따뜻한, 미니멀" />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">유료 판매</div>
                <div className="text-xs text-muted-foreground">활성화하면 가격을 설정할 수 있습니다.</div>
              </div>
              <Switch checked={paid} onCheckedChange={setPaid} />
            </div>
            {paid && (
              <div>
                <Label className="text-xs">가격 (원)</Label>
                <Input type="number" className="mt-1.5" placeholder="4900" />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">옵션</div>
            <div className="flex items-center justify-between"><Label className="text-sm">댓글 허용</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">평점 허용</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">라이선스 / 저작권 표시</Label><span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" />준비 중</span></div>
          </div>

          <Button className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90"><UploadIcon className="h-4 w-4 mr-2" />게시하기</Button>
        </div>
      </div>
    </div>
  );
}