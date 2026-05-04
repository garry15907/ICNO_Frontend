import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { marketplacePresets, libraryPresets, wishlistIds, downloadedIds, purchasedIds, currentUser, reviews as mockReviews, followedCreators } from "@/data/mockData";
import { useProfile, isImageAvatar } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Heart, Download, Receipt, Store, Star, RotateCcw, ExternalLink, FolderOpen, Camera, ChevronLeft, TrendingUp, MessageSquare, Activity, Calendar, Shield, Upload, Eye, EyeOff, Pencil, Trash2, Flag, CheckCircle2, Info, ChevronRight, Users, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export function ProfileMain() {
  const nav = useNavigate();
  const { profile, setProfile } = useProfile();
  const [editOpen, setEditOpen] = useState(false);
  const [defaultPickerOpen, setDefaultPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(profile);
  const defaultAvatars = ["🎤", "🎸", "🥁", "🎹", "🎧", "🎼", "🎺", "🎻", "🪕", "🎷"];
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const stats = [
    { label: "찜", value: wishlistIds.length, to: "/profile/wishlist", icon: Heart },
    { label: "다운로드", value: downloadedIds.length, to: "/profile/downloads", icon: Download },
    { label: "구매", value: purchasedIds.length, to: "/profile/purchases", icon: Receipt },
    { label: "내 상품", value: 3, to: "/profile/sales", icon: Store },
    { label: "팔로잉", value: followedCreators.length, to: "/profile/following", icon: Users },
  ];
  const [following, setFollowing] = useState(followedCreators);
  const [unfollowTarget, setUnfollowTarget] = useState<string | null>(null);
  const handleUnfollow = () => {
    if (!unfollowTarget) return;
    setFollowing((prev) => prev.filter((c) => c.name !== unfollowTarget));
    toast({ title: "팔로우 해제됨", description: `@${unfollowTarget} 팔로우를 해제했습니다.` });
    setUnfollowTarget(null);
  };
  const quickMenus = [
    { title: "찜한 프리셋", desc: "관심 있는 프리셋 모아보기", icon: Heart, to: "/profile/wishlist" },
    { title: "다운로드 목록", desc: "원본 재다운로드 및 초기 복원", icon: Download, to: "/profile/downloads" },
    { title: "구매 내역", desc: "구매한 유료 프리셋 확인", icon: Receipt, to: "/profile/purchases" },
    { title: "내 상품 관리", desc: "업로드한 프리셋 관리", icon: Store, to: "/profile/sales" },
    { title: "팔로우 목록", desc: "팔로우한 크리에이터 모아보기", icon: Users, to: "/profile/following" },
  ];
  const recent = [
    { icon: Download, text: "노을 프리셋을 다운로드했습니다.", preset: "노을", time: "10분 전" },
    { icon: Heart, text: "커비 프리셋을 찜했습니다.", preset: "커비", time: "2시간 전" },
    { icon: Receipt, text: "픽셀 게임룸 프리셋을 구매했습니다.", preset: "픽셀 게임룸", time: "어제" },
    { icon: CheckCircle2, text: "노을 프리셋 위치를 저장했습니다.", preset: "노을", time: "2일 전" },
  ];
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="p-8 rounded-2xl bg-gradient-surface border border-border">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-primary grid place-items-center text-5xl shadow-glow overflow-hidden shrink-0">
            {isImageAvatar(profile.avatar) ? (
              <img src={profile.avatar} alt="프로필 사진" className="h-full w-full object-cover" />
            ) : (
              profile.avatar
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-3xl font-bold">{profile.nickname}</h2>
              <Badge variant="secondary" className="text-[10px]">{currentUser.role}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{currentUser.username}</div>
            {profile.bio && <p className="text-sm text-foreground/80 mt-3 line-clamp-1">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 가입 2025-08-12</span>
              <span className="inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Steam: <span className="text-muted-foreground/80">미연동</span></span>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setForm(profile); setEditOpen(true); }}>프로필 편집</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => nav(s.to)} className="rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:shadow-glow transition-all">
            <s.icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickMenus.map((m) => (
          <button
            key={m.title}
            onClick={() => nav(m.to)}
            className="group flex items-center gap-4 p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-glow transition-all text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center shrink-0">
              <m.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">최근 활동</h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <ul className="divide-y divide-border">
          {recent.map((it, i) => (
            <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
                <it.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{it.text}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{it.preset}</div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{it.time}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">팔로우한 크리에이터</h3>
            <Badge variant="secondary" className="text-[10px]">{following.length}</Badge>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        {following.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            아직 팔로우한 크리에이터가 없습니다.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {following.map((c) => (
              <li
                key={c.name}
                className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:shadow-glow transition-all"
              >
                <button
                  onClick={() => nav(`/explore?creator=${c.name}`)}
                  className="h-11 w-11 rounded-full bg-gradient-primary grid place-items-center text-2xl shrink-0"
                  aria-label={`${c.name} 프로필 보기`}
                >
                  {c.avatar}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">@{c.name}</span>
                    {c.isNew && <Badge className="text-[9px] h-4 px-1.5 bg-primary/15 text-primary hover:bg-primary/20">NEW</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.role}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    업로드 {c.uploads} · 팔로워 {c.followers.toLocaleString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition"
                  onClick={() => setUnfollowTarget(c.name)}
                  aria-label="팔로우 해제"
                  title="팔로우 해제"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!unfollowTarget} onOpenChange={(o) => !o && setUnfollowTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팔로우를 해제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {unfollowTarget ? `@${unfollowTarget} 크리에이터를 팔로우 해제합니다.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfollow}>해제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setEditOpen(false)} className="p-1 rounded-md hover:bg-muted">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <DialogTitle>프로필 수정</DialogTitle>
              </div>
              <Button
                size="sm"
                className="bg-primary/20 text-primary hover:bg-primary/30 rounded-full"
                onClick={() => {
                  setProfile(form);
                  setEditOpen(false);
                  toast({ title: "프로필이 저장되었습니다" });
                }}
              >
                저장
              </Button>
            </div>
            <DialogDescription className="sr-only">프로필 정보를 수정합니다.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-primary grid place-items-center text-5xl shadow-glow overflow-hidden">
                {isImageAvatar(form.avatar) ? (
                  <img src={form.avatar} alt="프로필 사진" className="h-full w-full object-cover" />
                ) : (
                  form.avatar
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilePick}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border border-border grid place-items-center hover:border-primary transition">
                    <Camera className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    파일에서 선택하기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDefaultPickerOpen(true)}>
                    기본 이미지로 선택하기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Dialog open={defaultPickerOpen} onOpenChange={setDefaultPickerOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>기본 이미지 선택</DialogTitle>
                <DialogDescription>원하는 기본 이미지를 선택하세요.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-5 gap-3 pt-2">
                {defaultAvatars.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setForm({ ...form, avatar: emoji });
                      setDefaultPickerOpen(false);
                    }}
                    className="h-14 w-14 rounded-full bg-gradient-primary grid place-items-center text-3xl hover:ring-2 hover:ring-primary transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-4 rounded-2xl bg-muted/30 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">이름</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">닉네임</Label>
              <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">자기소개</Label>
              <Textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="자신을 소개해 보세요"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Wishlist() {
  const nav = useNavigate();
  const [removed, setRemoved] = useState<string[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const items = marketplacePresets.filter(
    (p) => wishlistIds.includes(p.id) && !removed.includes(p.id),
  );
  const handleUnlike = () => {
    if (!confirmTarget) return;
    setRemoved((prev) => [...prev, confirmTarget.id]);
    toast({ title: "찜 해제됨", description: `${confirmTarget.name}을(를) 찜 목록에서 제거했습니다.` });
    setConfirmTarget(null);
  };
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
          <Button
            size="sm"
            variant="ghost"
            aria-label="찜 해제"
            title="찜 해제"
            onClick={() => setConfirmTarget({ id: p.id, name: p.name })}
          >
            <Heart className="h-4 w-4 fill-destructive text-destructive" />
          </Button>
        </div>
      ))}
      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>찜 목록에서 제거할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget ? `"${confirmTarget.name}"을(를) 찜 목록에서 제거합니다.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlike} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">제거</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <ProfileList title="내 상품" subtitle="내가 업로드한 프리셋을 관리합니다.">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { l: "내 상품 수", v: my.length.toString() },
          { l: "총 다운로드", v: "12,480" },
          { l: "평균 평점", v: "4.85" },
          { l: "이번 달 판매", v: "32" },
          { l: "예상 수익", v: "준비 중" },
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
            <div className="flex items-center gap-2">
              <div className="font-semibold text-sm truncate">{p.name}</div>
              <Badge variant="outline" className="text-[10px]">{p.price === 0 ? "무료" : "유료"}</Badge>
              <Badge variant="secondary" className="text-[10px]">공개</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {p.price === 0 ? "무료" : `₩${p.price.toLocaleString()}`} · {p.downloads.toLocaleString()} 다운로드 · 판매 {Math.floor(p.downloads / 10)} · ★{p.rating} ({p.reviews}) · 댓글 {p.reviews} · 신고 0
            </div>
          </div>
          <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5 mr-1" />마켓</Button>
          <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5 mr-1" />수정</Button>
          <Button size="sm" variant="ghost"><EyeOff className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </ProfileList>
  );
}

export function Reviews() {
  const myReviews = mockReviews.slice(0, 2);
  const receivedReviews = mockReviews;
  const myComments = [
    { id: "c1", preset: "노을", text: "이 색감 정말 좋네요!", date: "2026-04-22" },
    { id: "c2", preset: "픽셀 게임룸", text: "아이콘 위치 어떻게 잡으셨어요?", date: "2026-04-18" },
  ];
  return (
    <div className="space-y-6">
      <Section title="내가 작성한 리뷰">
        {myReviews.map((r) => (
          <ReviewRow key={r.id} preset="노을" rating={r.rating} text={r.text} date={r.date} likes={r.likes} />
        ))}
      </Section>
      <Section title="내 상품에 달린 리뷰">
        {receivedReviews.map((r) => (
          <ReviewRow key={r.id} preset="픽셀 게임룸" rating={r.rating} text={r.text} date={r.date} likes={r.likes} reply />
        ))}
      </Section>
      <Section title="내 댓글">
        {myComments.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
            <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="text-sm"><span className="font-semibold">{c.preset}</span> · <span className="text-muted-foreground text-xs">{c.date}</span></div>
              <div className="text-sm text-foreground/80 mt-1">{c.text}</div>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function ReviewRow({ preset, rating, text, date, likes, reply }: { preset: string; rating: number; text: string; date: string; likes: number; reply?: boolean }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{preset}</span>
          <span className="text-xs text-amber-500">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <p className="text-sm text-foreground/80 mt-2">{text}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-muted-foreground inline-flex items-center gap-3">
          <span>👍 {likes}</span>
          <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" /> 신고 0</span>
        </div>
        {reply && <Button size="sm" variant="outline">답글</Button>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function ActivityFeed() {
  const items = [
    { icon: Download, text: "노을 프리셋을 다운로드했습니다.", preset: "노을", time: "10분 전" },
    { icon: Heart, text: "커비 프리셋을 찜했습니다.", preset: "커비", time: "2시간 전" },
    { icon: Star, text: "심해 프리셋에 리뷰를 남겼습니다.", preset: "심해", time: "어제" },
    { icon: Upload, text: "미니멀 블랙 프리셋을 업로드했습니다.", preset: "미니멀 블랙", time: "2일 전" },
    { icon: FolderOpen, text: "노을 프리셋을 보관함에 추가했습니다.", preset: "노을", time: "3일 전" },
    { icon: Receipt, text: "픽셀 게임룸 프리셋을 구매했습니다.", preset: "픽셀 게임룸", time: "5일 전" },
    { icon: CheckCircle2, text: "커스텀 아이콘 위치를 저장했습니다.", preset: "노을", time: "1주 전" },
  ];
  return (
    <ProfileList title="활동 기록" subtitle="최근 활동 내역입니다.">
      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-border">
        {items.map((it, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[18px] top-1 h-4 w-4 rounded-full bg-primary/15 border border-primary/40 grid place-items-center">
              <it.icon className="h-2.5 w-2.5 text-primary" />
            </div>
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="min-w-0">
                <div className="text-sm">{it.text}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{it.preset} · {it.time}</div>
              </div>
              <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </ProfileList>
  );
}

function ProfileList({ title, subtitle, children }: any) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <button
        onClick={() => nav("/profile")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ChevronLeft className="h-4 w-4" /> 프로필로 돌아가기
      </button>
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