import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketplacePresets, libraryPresets, wishlistIds, downloadedIds, purchasedIds, currentUser } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Heart, Download, Receipt, Store, Star, RotateCcw, ExternalLink, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function ProfileMain() {
  const nav = useNavigate();
  const stats = [
    { label: "찜", value: wishlistIds.length, to: "/profile/wishlist", icon: Heart },
    { label: "다운로드", value: downloadedIds.length, to: "/profile/downloads", icon: Download },
    { label: "구매", value: purchasedIds.length, to: "/profile/purchases", icon: Receipt },
    { label: "내 상품", value: 3, to: "/profile/sales", icon: Store },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-surface border border-border">
        <div className="h-20 w-20 rounded-full bg-gradient-primary grid place-items-center text-4xl shadow-glow">{currentUser.avatar}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{currentUser.name}</h2>
          <div className="text-sm text-muted-foreground">{currentUser.username} · {currentUser.role}</div>
        </div>
        <Button variant="outline">프로필 편집</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => nav(s.to)} className="rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:shadow-glow transition-all">
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Wishlist() {
  const nav = useNavigate();
  const items = marketplacePresets.filter((p) => wishlistIds.includes(p.id));
  return (
    <ProfileList title="찜한 프리셋" subtitle="저장해 둔 마켓 프리셋입니다.">
      {items.length === 0 ? <Empty text="찜한 프리셋이 없습니다." /> : items.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition">
          <img src={p.thumbnail} className="h-16 w-24 object-cover rounded-md" alt="" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground">@{p.creator.name} · ★{p.rating} · {p.downloads.toLocaleString()} 다운로드</div>
          </div>
          <span className="text-sm font-semibold">{p.price === 0 ? "무료" : `₩${p.price.toLocaleString()}`}</span>
          <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => nav(`/explore?preset=${p.id}`)}>{p.price === 0 ? "다운로드" : "구매"}</Button>
          <Button size="sm" variant="ghost"><Heart className="h-4 w-4 fill-destructive text-destructive" /></Button>
        </div>
      ))}
    </ProfileList>
  );
}

export function Downloads() {
  const items = marketplacePresets.filter((p) => downloadedIds.includes(p.id));
  const [restore, setRestore] = useState<string | null>(null);
  return (
    <ProfileList title="다운로드 목록" subtitle="다운로드한 프리셋을 다시 받거나 원본 상태로 복원할 수 있습니다.">
      {items.map((p) => {
        const lib = libraryPresets.find((l) => l.sourceMarketId === p.id);
        const status = lib ? (lib.status === "로컬 수정됨" ? "로컬 수정됨" : "보관함에 있음") : "보관함에서 삭제됨";
        return (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
            <img src={p.thumbnail} className="h-16 w-24 object-cover rounded-md" alt="" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">@{p.creator.name} · 2026-04-20 · v1.0 · {p.price === 0 ? "무료" : "구매함"}</div>
              <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{status}</span>
            </div>
            <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />다시 다운로드</Button>
            <Button size="sm" variant="outline"><FolderOpen className="h-3.5 w-3.5 mr-1" />보관함</Button>
            <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setRestore(p.id)}><RotateCcw className="h-3.5 w-3.5" /></Button>
          </div>
        );
      })}
      <Dialog open={!!restore} onOpenChange={(o) => !o && setRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프리셋을 초기 상태로 복원할까요?</DialogTitle>
            <DialogDescription>복원 방식을 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <button className="w-full text-left p-4 rounded-xl border border-border hover:border-primary transition">
              <div className="text-sm font-semibold">매핑 정보 유지하고 복원</div>
              <div className="text-xs text-muted-foreground mt-1">배경화면, 아이콘 이미지, 위치, 크기, 스타일을 복원하고 로컬 매핑은 유지합니다.</div>
            </button>
            <button className="w-full text-left p-4 rounded-xl border border-border hover:border-destructive transition">
              <div className="text-sm font-semibold text-destructive">전체 초기화</div>
              <div className="text-xs text-muted-foreground mt-1">모든 항목과 매핑을 초기화합니다. 아이콘을 다시 매핑해야 합니다.</div>
            </button>
            <Button variant="ghost" className="w-full" onClick={() => setRestore(null)}>취소</Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProfileList>
  );
}

export function Purchases() {
  const items = marketplacePresets.filter((p) => purchasedIds.includes(p.id));
  return (
    <ProfileList title="구매 내역" subtitle="구매한 유료 프리셋 목록입니다.">
      {items.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
          <img src={p.thumbnail} className="h-16 w-24 object-cover rounded-md" alt="" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground">@{p.creator.name} · 2026-04-15 · 결제 완료</div>
          </div>
          <span className="font-semibold text-sm">₩{p.price.toLocaleString()}</span>
          <Button size="sm" variant="outline"><Receipt className="h-3.5 w-3.5 mr-1" />영수증</Button>
          <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />다시 다운로드</Button>
        </div>
      ))}
    </ProfileList>
  );
}

export function Sales() {
  const my = marketplacePresets.slice(0, 3);
  return (
    <ProfileList title="판매 / 업로드 관리" subtitle="내가 게시한 상품을 관리합니다.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { l: "총 다운로드", v: "12,480" },
          { l: "이번 달 매출", v: "₩142,000" },
          { l: "평균 평점", v: "4.85" },
          { l: "신고", v: "0" },
        ].map(s => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{s.l}</div>
            <div className="text-xl font-bold mt-1">{s.v}</div>
          </div>
        ))}
      </div>
      {my.map(p => (
        <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
          <img src={p.thumbnail} className="h-16 w-24 object-cover rounded-md" alt="" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.price === 0 ? "무료" : `₩${p.price.toLocaleString()}`} · {p.downloads.toLocaleString()} 다운로드 · ★{p.rating} ({p.reviews})</div>
          </div>
          <Button size="sm" variant="outline">수정</Button>
          <Button size="sm" variant="outline">업데이트</Button>
          <Button size="sm" variant="ghost" className="text-destructive">숨김/삭제</Button>
        </div>
      ))}
    </ProfileList>
  );
}

function ProfileList({ title, subtitle, children }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">{text}</div>;
}