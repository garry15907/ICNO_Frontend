import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { useSidebarMode } from "@/lib/sidebar-mode";
import { useAppPreferences, type NotifKey } from "@/lib/app-preferences";
import * as engine from "@/services/localEngineApi";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const sections = [
  { id: "display", label: "화면" },
  { id: "library", label: "보관함" },
  { id: "windows", label: "Windows 적용" },
  { id: "notif", label: "알림" },
  { id: "account", label: "계정" },
  { id: "about", label: "앱 정보" },
];

const NOTIF_ROWS: { key: NotifKey; label: string }[] = [
  { key: "all", label: "전체 알림" },
  { key: "comment", label: "댓글" },
  { key: "rating", label: "평점" },
  { key: "download", label: "다운로드" },
  { key: "sales", label: "판매" },
  { key: "report", label: "신고" },
  { key: "error", label: "오류" },
];

export default function Settings() {
  const nav = useNavigate();
  const { theme, setTheme } = useTheme();
  const { mode: sidebarMode, setMode: setSidebarMode, hovered: sidebarHovered } = useSidebarMode();
  const { prefs, update, setNotification } = useAppPreferences();
  const collapsedSidebarWidth = 72;
  const sidebarExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && sidebarHovered);

  // 로컬 엔진 오버레이 설정 (GET/POST /api/settings — 보낸 키만 부분 업데이트)
  const [overlayAutostart, setOverlayAutostart] = useState(false);
  const [restoreOnExit, setRestoreOnExit] = useState(true);
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void engine
      .getSettings()
      .then((s) => {
        if (!alive) return;
        setOverlayAutostart(!!s.overlay_autostart);
        setRestoreOnExit(s.restore_on_exit !== false);
        setEngineReady(true);
      })
      .catch(() => {
        if (alive) setEngineReady(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const saveEngine = async (patch: Partial<engine.SettingsModel>, revert: () => void) => {
    try {
      await engine.saveSettings(patch);
    } catch (e) {
      revert();
      toast({
        title: "로컬 엔진에 저장하지 못했습니다",
        description: "ICNO 데스크톱 엔진이 실행 중인지 확인해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-8 items-start [--settings-page-x:1rem] sm:[--settings-page-x:1.5rem] lg:[--settings-page-x:2rem]">
      <aside
        style={{
          left: `max(calc(${collapsedSidebarWidth}px + var(--settings-page-x)), calc(50vw + ${collapsedSidebarWidth / 2}px - 700px + var(--settings-page-x)))`,
        }}
        className={`fixed top-20 lg:top-[5.5rem] z-0 w-[200px] space-y-1 min-w-0 max-h-[calc(100vh-7.5rem)] overflow-y-auto scrollbar-thin transition-opacity duration-200 ${sidebarExpanded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="block px-3 py-2 rounded-lg text-sm hover:bg-muted text-muted-foreground hover:text-foreground">
            {s.label}
          </a>
        ))}
      </aside>

      <div className="col-start-2 space-y-10 max-w-2xl">
        <Section id="display" title="화면">
          <Row label="테마">
            <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">시스템 설정</SelectItem>
                <SelectItem value="light">라이트</SelectItem>
                <SelectItem value="dark">다크</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="사이드바 표시">
            <Select value={sidebarMode} onValueChange={(v: any) => setSidebarMode(v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">펼치기</SelectItem>
                <SelectItem value="collapsed">아이콘만 표시</SelectItem>
                <SelectItem value="hover">마우스 오버 시 펼치기</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="시작 페이지">
            <Select value={prefs.startPage} onValueChange={(v: any) => update({ startPage: v })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="home">홈</SelectItem>
                <SelectItem value="explore">탐색</SelectItem>
                <SelectItem value="library">보관함</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section id="library" title="보관함">
          <Row label="기본 정렬">
            <Select value={prefs.librarySort} onValueChange={(v: any) => update({ librarySort: v })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">최근순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="즐겨찾기 우선 표시">
            <Switch checked={prefs.pinnedFirst} onCheckedChange={(v) => update({ pinnedFirst: v })} />
          </Row>
        </Section>

        <Section id="windows" title="Windows 적용">
          <Row label="앱 시작 시 오버레이 자동 시작">
            <Switch
              checked={overlayAutostart}
              disabled={!engineReady}
              onCheckedChange={(v) => {
                const prev = overlayAutostart;
                setOverlayAutostart(v);
                void saveEngine({ overlay_autostart: v }, () => setOverlayAutostart(prev));
              }}
            />
          </Row>
          <Row label="앱 종료 시 기본 데스크톱 아이콘 복원">
            <Switch
              checked={restoreOnExit}
              disabled={!engineReady}
              onCheckedChange={(v) => {
                const prev = restoreOnExit;
                setRestoreOnExit(v);
                void saveEngine({ restore_on_exit: v }, () => setRestoreOnExit(prev));
              }}
            />
          </Row>
          {!engineReady && (
            <div className="p-4 text-xs text-muted-foreground">
              로컬 엔진에 연결되지 않아 이 설정을 저장할 수 없습니다.
            </div>
          )}
        </Section>

        <Section id="notif" title="알림">
          {NOTIF_ROWS.map((r) => (
            <Row key={r.key} label={r.label}>
              <Switch
                checked={r.key === "all" ? prefs.notifications.all : prefs.notifications.all && prefs.notifications[r.key]}
                disabled={r.key !== "all" && !prefs.notifications.all}
                onCheckedChange={(v) => setNotification(r.key, v)}
              />
            </Row>
          ))}
        </Section>

        <Section id="account" title="계정">
          <Row label="프로필 편집">
            <Button variant="outline" size="sm" onClick={() => nav("/profile")}>편집</Button>
          </Row>
          <Row label="다운로드 목록">
            <Button variant="outline" size="sm" onClick={() => nav("/profile/downloads")}>보기</Button>
          </Row>
          <Row label="찜한 목록">
            <Button variant="outline" size="sm" onClick={() => nav("/profile/wishlist")}>보기</Button>
          </Row>
          <Row label="내 상품 관리">
            <Button variant="outline" size="sm" onClick={() => nav("/profile/sales")}>관리</Button>
          </Row>
        </Section>

        <Section id="about" title="앱 정보">
          <Row label="앱 버전"><span className="text-sm text-muted-foreground">ICNO 1.2.0</span></Row>
          <Row label="업데이트 확인">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "최신 버전입니다" })}>확인</Button>
          </Row>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, children }: any) {
  return (
    <section id={id} className="scroll-mt-20">
      <h3 className="text-xl font-bold tracking-tight mb-4">{title}</h3>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {children}
      </div>
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4">
      <Label className="text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
