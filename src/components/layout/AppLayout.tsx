import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-auto">
      <div className="flex min-h-screen min-w-[940px]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto w-full max-w-[1400px] px-8 py-8 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}