import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, type Notice } from "@/lib/notifications";
import { MessageCircle, Star, Download, Heart, UserPlus, Trash2, MailOpen, ArrowUpRight, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const iconFor: Record<Notice["type"], any> = {
  comment: MessageCircle, rating: Star, download: Download, like: Heart, follow: UserPlus,
};
const colorFor: Record<Notice["type"], string> = {
  comment: "text-primary", rating: "text-warning", download: "text-success",
  like: "text-destructive", follow: "text-primary",
};
const labelFor: Record<Notice["type"], string> = {
  comment: "댓글", rating: "별점", download: "다운로드", like: "찜", follow: "팔로우",
};

export default function Notifications() {
  const { items, unreadCount, loading, signedIn, markRead, markUnread, markAllRead, remove } = useNotifications();
  const nav = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = items.find((n) => n.id === selectedId) ?? null;

  const handleOpen = (n: Notice) => {
    setSelectedId(n.id);
    if (!n.read) markRead(n.id);
  };

  const handleDelete = () => {
    if (!selected) return;
    remove(selected.id);
    setConfirmDelete(false);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">알림</h2>
          <p className="text-muted-foreground mt-1">최근 활동과 알림을 확인하세요.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          모두 읽음 처리
        </Button>
      </div>

      {!signedIn ? (
        <div className="border border-dashed rounded-xl p-12 text-center bg-card/50">
          <BellOff className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">로그인하면 알림을 확인할 수 있습니다.</p>
          <Button size="sm" onClick={() => nav("/auth")}>로그인</Button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[76px] rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center bg-card/50">
          <BellOff className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">아직 받은 알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = iconFor[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-4 rounded-xl border bg-card transition-all cursor-pointer",
                  "hover:border-primary/50 hover:bg-card/80",
                  n.read ? "border-border opacity-70" : "border-border shadow-card",
                )}
              >
                <div className={cn("h-9 w-9 rounded-lg bg-muted grid place-items-center shrink-0", colorFor[n.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm", n.read ? "font-medium text-foreground/80" : "font-semibold text-foreground")}>{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className={cn("text-sm mt-0.5 truncate", n.read ? "text-muted-foreground" : "text-foreground/80")}>{n.body}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          {selected && (() => {
            const Icon = iconFor[selected.type];
            return (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg bg-muted grid place-items-center", colorFor[selected.type])}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">{labelFor[selected.type]}</div>
                      <SheetTitle className="text-left">{selected.title}</SheetTitle>
                    </div>
                  </div>
                  <SheetDescription className="text-left">{selected.time}</SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4 flex-1 overflow-y-auto">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-foreground/90">{selected.body}</p>
                  </div>
                  {selected.detail && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <div className="text-xs font-semibold text-primary mb-1.5">상세 내용</div>
                      <p className="text-sm text-foreground/80 whitespace-pre-line">{selected.detail}</p>
                    </div>
                  )}
                  <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
                    {selected.relatedPresetId && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">관련 프리셋</span>
                        <span className="font-medium">{selected.relatedPresetId}</span>
                      </div>
                    )}
                    {selected.relatedUserId && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">관련 사용자</span>
                        <span className="font-medium">@{selected.relatedUserId}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">유형</span>
                      <span className="font-medium">{labelFor[selected.type]}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t space-y-2">
                  {selected.targetRoute && (
                    <Button
                      className="w-full"
                      onClick={() => { const r = selected.targetRoute!; setSelectedId(null); nav(r); }}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      관련 페이지로 이동
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { markUnread(selected.id); setSelectedId(null); }}
                    >
                      <MailOpen className="h-4 w-4" />
                      읽지 않음
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => setSelectedId(null)}>닫기</Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알림을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>이 알림은 삭제 후 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}