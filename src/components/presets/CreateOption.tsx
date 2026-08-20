import type { LucideIcon } from "lucide-react";

/** 보관함 '새로 만들기' 모달에서 쓰는 공용 옵션 버튼. */
export function CreateOption({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
    >
      <Icon className="h-5 w-5 text-primary mb-2" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}
