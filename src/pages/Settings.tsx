import { useTheme } from "@/lib/theme";
import { useSidebarMode } from "@/lib/sidebar-mode";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sections = [
  { id: "display", label: "화면" },
  { id: "library", label: "보관함" },
  { id: "windows", label: "Windows 적용" },
  { id: "notif", label: "알림" },
  { id: "account", label: "계정" },
  { id: "about", label: "앱 정보" },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { mode: sidebarMode, setMode: setSidebarMode, hovered: sidebarHovered } = useSidebarMode();
  const collapsedSidebarWidth = 72;
  const sidebarExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && sidebarHovered);

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
            <Select defaultValue="home">
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="home">홈</SelectItem>
                <SelectItem value="explore">탐색</SelectItem>
                <SelectItem value="library">보관함</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section id="market" title="마켓 / 탐색">
          <Row label="기본 정렬">
            <Select defaultValue="인기순"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{["인기순","최신순","다운로드순","평점순"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
          </Row>
          <Row label="기본 무료/유료">
            <Select defaultValue="전체"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{["전체","무료","유료"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
          </Row>
          <Row label="다운로드한 프리셋 자동 보관함 저장"><Switch defaultChecked /></Row>
          <Row label="부적절한 콘텐츠 숨기기"><Switch defaultChecked /></Row>
          <Row label="댓글 알림"><Switch defaultChecked /></Row>
          <Row label="평점 알림"><Switch defaultChecked /></Row>
        </Section>

        <Section id="library" title="보관함">
          <Row label="기본 정렬">
            <Select defaultValue="recent"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="recent">최근순</SelectItem><SelectItem value="name">이름순</SelectItem></SelectContent></Select>
          </Row>
          <Row label="즐겨찾기 우선 표시"><Switch /></Row>
          <Row label="다운로드한 프리셋 자동 저장"><Switch defaultChecked /></Row>
          <Row label="구매한 프리셋 자동 저장"><Switch defaultChecked /></Row>
          <Row label="백업 / 복원"><Button variant="outline" size="sm">설정</Button></Row>
        </Section>

        <Section id="windows" title="Windows 적용">
          <Row label="앱 시작 시 오버레이 자동 시작"><Switch /></Row>
          <Row label="앱 종료 시 기본 데스크톱 아이콘 복원"><Switch defaultChecked /></Row>
        </Section>

        <Section id="notif" title="알림">
          {["전체 알림","댓글","평점","다운로드","판매","신고","오류"].map(l => (
            <Row key={l} label={l}><Switch defaultChecked /></Row>
          ))}
        </Section>

        <Section id="account" title="계정">
          <Row label="프로필 편집"><Button variant="outline" size="sm">편집</Button></Row>
          <Row label="다운로드 목록"><Button variant="outline" size="sm">보기</Button></Row>
          <Row label="찜한 프리셋"><Button variant="outline" size="sm">보기</Button></Row>
          <Row label="구매 내역"><Button variant="outline" size="sm">보기</Button></Row>
          <Row label="판매/업로드 관리"><Button variant="outline" size="sm">관리</Button></Row>
          <Row label="차단된 사용자"><Button variant="outline" size="sm">관리</Button></Row>
          <Row label="계정 삭제"><Button variant="outline" size="sm" className="text-destructive">삭제</Button></Row>
        </Section>

        <Section id="about" title="앱 정보">
          <Row label="앱 버전"><span className="text-sm text-muted-foreground">ICNO 1.2.0</span></Row>
          <Row label="업데이트 확인"><Button variant="outline" size="sm">확인</Button></Row>
          <Row label="오픈소스 라이선스"><Button variant="ghost" size="sm">보기</Button></Row>
          <Row label="이용약관"><Button variant="ghost" size="sm">보기</Button></Row>
          <Row label="개인정보 처리방침"><Button variant="ghost" size="sm">보기</Button></Row>
          <Row label="문의 / 피드백"><Button variant="outline" size="sm">보내기</Button></Row>
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