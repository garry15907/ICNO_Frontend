import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { SidebarModeProvider } from "@/lib/sidebar-mode";
import { ProfileProvider } from "@/lib/profile";
import { WishlistProvider } from "@/lib/wishlist";
import { NotificationsProvider } from "@/lib/notifications";
import { LibraryProvider } from "@/lib/library";
import { IconLibraryProvider } from "@/lib/icon-library";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Library from "./pages/Library";
import IconMaker from "./pages/IconMaker";
import Upload from "./pages/Upload";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { ProfileMain, Wishlist, Downloads, Sales, Following } from "./pages/Profile";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";
import { readPreferences } from "@/lib/app-preferences";
import * as engine from "@/services/localEngineApi";

const queryClient = new QueryClient();

const START_ROUTES = { home: "/", explore: "/explore", library: "/library" } as const;

/** 설정된 시작 페이지로 첫 진입 시 한 번만 이동한다. */
function StartPageRedirect() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (pathname !== "/") return;
    const target = START_ROUTES[readPreferences().startPage];
    if (target !== "/") nav(target, { replace: true });
  }, [nav, pathname]);
  return null;
}

/** overlay_autostart 가 켜져 있으면 앱 로드 시 오버레이를 한 번 시작한다. */
function OverlayAutostart() {
  useEffect(() => {
    void engine
      .getSettings()
      .then((s) => {
        if (s.overlay_autostart) return engine.startOverlay();
      })
      .catch(() => {
        /* 로컬 엔진 미실행 — 무시 */
      });
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SidebarModeProvider>
      <ProfileProvider>
      <WishlistProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <NotificationsProvider>
          <LibraryProvider>
          <IconLibraryProvider>
          <AppLayout>
            <StartPageRedirect />
            <OverlayAutostart />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/library" element={<Library />} />
              <Route path="/icon-maker" element={<IconMaker />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<ProfileMain />} />
              <Route path="/profile/wishlist" element={<Wishlist />} />
              <Route path="/profile/downloads" element={<Downloads />} />
              <Route path="/profile/sales" element={<Sales />} />
              <Route path="/profile/following" element={<Following />} />
              <Route path="/creator/:name" element={<CreatorProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
          </IconLibraryProvider>
          </LibraryProvider>
          </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </WishlistProvider>
      </ProfileProvider>
      </SidebarModeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
