import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type SidebarMode = "expanded" | "collapsed" | "hover";
type Ctx = {
  mode: SidebarMode;
  setMode: (m: SidebarMode) => void;
  hovered: boolean;
  setHovered: (h: boolean) => void;
};

const SidebarModeCtx = createContext<Ctx | null>(null);

export function SidebarModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SidebarMode>(() => {
    if (typeof window === "undefined") return "expanded";
    return (localStorage.getItem("icno-sidebar-mode") as SidebarMode) || "expanded";
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    localStorage.setItem("icno-sidebar-mode", mode);
  }, [mode]);

  return (
    <SidebarModeCtx.Provider value={{ mode, setMode: setModeState, hovered, setHovered }}>
      {children}
    </SidebarModeCtx.Provider>
  );
}

export function useSidebarMode() {
  const ctx = useContext(SidebarModeCtx);
  if (!ctx) throw new Error("useSidebarMode must be used inside SidebarModeProvider");
  return ctx;
}