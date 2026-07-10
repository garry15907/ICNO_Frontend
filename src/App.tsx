import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
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
import { ProfileMain, Wishlist, Downloads, Purchases, Sales, Following } from "./pages/Profile";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";

function LibraryRedirect() {
  const { id } = useParams();
  return <Navigate to={`/library?open=${encodeURIComponent(id ?? "")}`} replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SidebarModeProvider>
      <ProfileProvider>
      <WishlistProvider>
      <NotificationsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LibraryProvider>
          <IconLibraryProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:id" element={<LibraryRedirect />} />
              <Route path="/icon-maker" element={<IconMaker />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<ProfileMain />} />
              <Route path="/profile/wishlist" element={<Wishlist />} />
              <Route path="/profile/downloads" element={<Downloads />} />
              <Route path="/profile/purchases" element={<Purchases />} />
              <Route path="/profile/sales" element={<Sales />} />
              <Route path="/profile/following" element={<Following />} />
              <Route path="/creator/:name" element={<CreatorProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
          </IconLibraryProvider>
          </LibraryProvider>
        </BrowserRouter>
      </TooltipProvider>
      </NotificationsProvider>
      </WishlistProvider>
      </ProfileProvider>
      </SidebarModeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
