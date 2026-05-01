import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { SidebarModeProvider } from "@/lib/sidebar-mode";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Library from "./pages/Library";
import LibraryDetail from "./pages/LibraryDetail";
import IconMaker from "./pages/IconMaker";
import Upload from "./pages/Upload";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import { ProfileMain, Wishlist, Downloads, Purchases, Sales } from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SidebarModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:id" element={<LibraryDetail />} />
              <Route path="/icon-maker" element={<IconMaker />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<ProfileMain />} />
              <Route path="/profile/wishlist" element={<Wishlist />} />
              <Route path="/profile/downloads" element={<Downloads />} />
              <Route path="/profile/purchases" element={<Purchases />} />
              <Route path="/profile/sales" element={<Sales />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
      </SidebarModeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
