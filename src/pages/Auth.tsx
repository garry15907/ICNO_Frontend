import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Auth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const { user, loading, signIn, signUp } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav(redirect, { replace: true });
  }, [loading, user, nav, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === "signup") {
        if (!displayName.trim()) {
          setError("표시이름을 입력해주세요.");
          return;
        }
        const { error } = await signUp(email.trim(), password, displayName.trim());
        if (error) {
          setError(error);
          return;
        }
        toast({ title: "회원가입이 완료되었습니다." });
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setError(error);
          return;
        }
        toast({ title: "로그인되었습니다." });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ICNO 계정</h1>
            <p className="text-xs text-muted-foreground">프리셋 저장과 업로드를 위해 로그인하세요</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setError(null); }}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="signin">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>

          <form onSubmit={submit} className="space-y-3.5">
            <TabsContent value="signup" className="m-0 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">표시이름</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 유리"
                  maxLength={40}
                  autoComplete="nickname"
                />
              </div>
            </TabsContent>

            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {tab === "signup" ? "회원가입" : "로그인"}
            </Button>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
