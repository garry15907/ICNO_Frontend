import { useLocation, useNavigate } from "react-router-dom";
import { Search, Minus, Square, X, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/lib/notifications";

const titleMap: Record<string, string> = {
  "/": "홈",
  "/explore": "탐색",
  "/library": "보관함",
  "/notifications": "알림",
  "/settings": "설정",
  "/upload": "프리셋 편집",
  "/icon-maker": "아이콘 제작",
  "/profile": "내 프로필",
  "/profile/wishlist": "찜한 프리셋",
  "/profile/downloads": "다운로드 목록",
  "/profile/purchases": "구매 내역",
  "/profile/sales": "판매/업로드 관리",
};

export function Topbar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { unreadCount } = useNotifications();
  const title = titleMap[pathname] ?? "ICNO";

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/40 backdrop-blur-md flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-3 md:gap-4 sticky top-0 z-30">
      <h1 className="shrink-0 text-sm font-semibold text-foreground/80">{title}</h1>
      <div className="flex-1 min-w-0 max-w-md mx-auto relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="프리셋, 크리에이터, 태그 검색"
          className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
        />
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          onClick={() => nav("/notifications")}
          aria-label="알림"
          className="relative h-8 w-8 grid place-items-center rounded hover:bg-muted text-muted-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 text-[9px] leading-none font-semibold bg-primary text-primary-foreground rounded-full min-w-[14px] h-[14px] px-1 grid place-items-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground"><Minus className="h-3.5 w-3.5" /></button>
          <button className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground"><Square className="h-3 w-3" /></button>
          <button className="h-7 w-7 grid place-items-center rounded hover:bg-destructive hover:text-destructive-foreground text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </header>
  );
}