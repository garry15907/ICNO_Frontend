import { notifications, Notice } from "@/data/mockData";
import { MessageCircle, Star, Download, DollarSign, Flag, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconFor: Record<Notice["type"], any> = {
  comment: MessageCircle, rating: Star, download: Download, sale: DollarSign, report: Flag, update: Sparkles, error: AlertTriangle,
};
const colorFor: Record<Notice["type"], string> = {
  comment: "text-primary", rating: "text-warning", download: "text-success",
  sale: "text-success", report: "text-destructive", update: "text-primary", error: "text-destructive",
};

export default function Notifications() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">알림</h2>
          <p className="text-muted-foreground mt-1">최근 활동과 알림을 확인하세요.</p>
        </div>
        <Button variant="ghost" size="sm">모두 읽음 처리</Button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = iconFor[n.type];
          return (
            <div key={n.id} className={cn(
              "flex items-start gap-3 p-4 rounded-xl border bg-card transition-all hover:border-primary/40",
              n.read ? "border-border opacity-70" : "border-border shadow-card",
            )}>
              <div className={cn("h-9 w-9 rounded-lg bg-muted grid place-items-center", colorFor[n.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{n.title}</span>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-foreground/80 mt-0.5">{n.body}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}