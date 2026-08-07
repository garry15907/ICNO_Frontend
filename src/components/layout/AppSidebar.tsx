import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Library, Bell, Settings, Sparkles, ChevronUp, User, Heart, Download, Receipt, Store, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/data/mockData";
import { useSidebarMode } from "@/lib/sidebar-mode";
import { useProfile, isImageAvatar } from "@/lib/profile";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "홈", icon: Home },
  { to: "/explore", label: "탐색", icon: Compass },
  { to: "/library", label: "보관함", icon: Library },
  { to: "/notifications", label: "알림", icon: Bell, badgeKey: "notifications" as const },
  { to: "/settings", label: "설정", icon: Settings },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { mode, hovered, setHovered } = useSidebarMode();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const expanded =
    mode === "expanded" || (mode === "hover" && hovered);
  const collapsed = !expanded;
  // 사이드바 외부 너비만 바꾸고, 내부 컨텐츠는 항상 펼친 레이아웃으로 렌더 → 찌그러짐 없음
  const EXPANDED_WIDTH = 240;
  const COLLAPSED_WIDTH = 72;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
      }}
      className={cn(
        "flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width]",
        mode === "hover" && hovered && "z-40 shadow-card",
      )}
    >
      {/* 내부 wrapper: 항상 EXPANDED_WIDTH로 고정 → 아이콘/텍스트 위치가 절대 흔들리지 않음. 외부 aside의 width만 변하며 overflow-hidden으로 잘림 */}
      <div
        className="flex flex-col h-full self-start shrink-0"
        style={{ width: EXPANDED_WIDTH }}
      >
      {/* Logo */}
      <div className="pt-6 pb-5 flex items-center gap-3 px-5">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div
          className={cn(
            "overflow-hidden whitespace-nowrap transition-opacity",
            collapsed ? "opacity-0 duration-100" : "opacity-100 duration-200 delay-[220ms]"
          )}
        >
          <div className="text-lg font-bold tracking-tight text-sidebar-foreground">ICNO</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl py-2.5 px-3 text-sm font-medium transition-all min-w-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="relative shrink-0">
                <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                {("badgeKey" in item && item.badgeKey === "notifications" && unreadCount > 0) ? (
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none font-semibold bg-primary text-primary-foreground rounded-full min-w-[14px] h-[14px] px-1 grid place-items-center">
                    {unreadCount}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "flex-1 truncate transition-opacity",
                  collapsed ? "opacity-0 duration-100" : "opacity-100 duration-200 delay-[220ms]"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            "w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-sidebar-accent transition-colors text-left"
          )}>
            <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-base">
              {isImageAvatar(profile.avatar) ? (
                <img src={profile.avatar} alt="프로필 사진" className="h-full w-full rounded-full object-cover" />
              ) : (
                profile.avatar
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-3 flex-1 min-w-0 opacity-0 animate-[fade-in_0.25s_ease-out_220ms_forwards]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-sidebar-foreground truncate">{profile.nickname}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{currentUser.role}</div>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>{currentUser.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav("/profile")}><User className="h-4 w-4 mr-2" />내 프로필</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/wishlist")}><Heart className="h-4 w-4 mr-2" />찜한 프리셋</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/downloads")}><Download className="h-4 w-4 mr-2" />다운로드 목록</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/purchases")}><Receipt className="h-4 w-4 mr-2" />구매 내역</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/sales")}><Store className="h-4 w-4 mr-2" />판매/업로드 관리</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/following")}><Users className="h-4 w-4 mr-2" />팔로우 목록</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4 mr-2" />로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </aside>
  );
}