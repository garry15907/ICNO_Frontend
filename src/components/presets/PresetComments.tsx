import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePresetComments } from "@/lib/market-social";

/** Comment list + composer. Bodies render as plain text (React escaping only). */
export function PresetComments({ presetId, myUserId }: { presetId: string; myUserId: string | null }) {
  const { comments, loading, add, remove } = usePresetComments(presetId);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const ok = await add(draft);
    setBusy(false);
    if (ok) setDraft("");
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">댓글 {comments.length}</h3>
      <div className="space-y-2">
        <Textarea
          value={draft}
          maxLength={1000}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="댓글을 남겨보세요 (최대 1000자)"
          className="min-h-[72px] text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{draft.length}/1000</span>
          <Button size="sm" disabled={busy || draft.trim().length === 0} onClick={submit}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "등록"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">불러오는 중…</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{c.author}</div>
                  <div className="text-[10px] text-muted-foreground">{c.created_at.slice(0, 16).replace("T", " ")}</div>
                </div>
                {myUserId === c.user_id && (
                  <button
                    onClick={() => void remove(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="댓글 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* Plain-text output: newlines only, no HTML injection. */}
              <p className="text-sm mt-2 whitespace-pre-wrap break-words">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}