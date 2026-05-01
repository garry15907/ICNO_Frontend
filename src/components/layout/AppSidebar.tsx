import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Library, Bell, Settings, Sparkles, ChevronUp, User, Heart, Download, Receipt, Store, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/data/mockData";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "홈", icon: Home },
  { to: "/explore", label: "탐색", icon: Compass },
  { to: "/library", label: "보관함", icon: Library },
  { to: "/notifications", label: "알림", icon: Bell, badge: 3 },
  { to: "/settings", label: "설정", icon: Settings },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  return (
    <aside className="flex w-[clamp(64px,18vw,16rem)] shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen overflow-hidden">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-sidebar-foreground">ICNO</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">데스크톱 프리셋 마켓</div>
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
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all min-w-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="relative shrink-0">
                <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none font-semibold bg-primary text-primary-foreground rounded-full min-w-[14px] h-[14px] px-1 grid place-items-center">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-sidebar-accent transition-colors text-left">
            <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-base">
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-sidebar-foreground truncate">{currentUser.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{currentUser.role}</div>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>{currentUser.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav("/profile")}><User className="h-4 w-4 mr-2" />내 프로필</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/wishlist")}><Heart className="h-4 w-4 mr-2" />찜한 프리셋</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/downloads")}><Download className="h-4 w-4 mr-2" />다운로드 목록</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/purchases")}><Receipt className="h-4 w-4 mr-2" />구매 내역</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/profile/sales")}><Store className="h-4 w-4 mr-2" />판매/업로드 관리</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4 mr-2" />로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}