import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  Pencil,
  Send,
  Sparkles,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Workbench } from "@/lib/use-workbench";

export function ChatPane({ wb }: { wb: Workbench }) {
  const [draft, setDraft] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customLens, setCustomLens] = useState("");
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);
  const [advisoryFor, setAdvisoryFor] = useState<{ lens: string; isCustom: boolean } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wb.messages.length, wb.thinking]);

  // Reset advisory dismissal when conflicts change
  useEffect(() => {
    if (wb.unresolved.length > 0) setAdvisoryDismissed(false);
  }, [wb.unresolved.length]);

  function requestGeneration(lens: string, isCustom: boolean) {
    if (wb.unresolved.length > 0) {
      setAdvisoryFor({ lens, isCustom });
      return;
    }
    void wb.generate(lens, isCustom);
  }

  const sessionName = wb.activeSession?.name ?? "New chat";
  const sessionEmoji = wb.activeSession?.emoji ?? "💬";

  return (
    <section className="pane min-w-0 flex-1">
      <header className="flex items-center justify-between gap-2 border-b border-glass-border px-5 py-3">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (wb.activeChatSessionId && nameInput.trim()) {
                  wb.renameChat(wb.activeChatSessionId, nameInput.trim());
                }
                setEditingName(false);
              }}
            >
              <span className="shrink-0 text-base leading-none">{sessionEmoji}</span>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onBlur={() => {
                  if (wb.activeChatSessionId && nameInput.trim()) {
                    wb.renameChat(wb.activeChatSessionId, nameInput.trim());
                  }
                  setEditingName(false);
                }}
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setNameInput(sessionName);
                setEditingName(true);
              }}
              className="group flex items-center gap-1.5 text-left"
            >
              <span className="shrink-0 text-base leading-none">{sessionEmoji}</span>
              <p className="truncate text-sm font-medium">{sessionName}</p>
              <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="New chat"
            title="New chat"
            onClick={() => wb.createChat()}
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-5 py-5">
          {!wb.messages.length && (
            <div className="glass-soft rounded-xl px-4 py-4 text-sm text-muted-foreground">
              <p className="text-foreground">Ask anything about your sources.</p>
              <p className="mt-1">
                Answers are pulled straight from the pool — no gating, no rewriting of your
                documents. When you're ready, pick a lens below to generate a 1-Page Executive
                Poster.
              </p>
            </div>
          )}

          {wb.messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass-soft text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* Inline Conflict Advisory banner */}
          {wb.unresolved.length > 0 && !advisoryDismissed && wb.messages.length > 0 && (
            <div className="glass-soft rounded-xl border-advisory/50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-advisory">
                  <TriangleAlert className="size-4 shrink-0" />
                  Conflict Advisory
                </div>
                <button
                  onClick={() => setAdvisoryDismissed(true)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                ⚠ Unresolved contradictions exist in your source pool. You can still generate, but
                artifacts will carry a visible caveat.
              </p>
            </div>
          )}

          {wb.thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Reading the pool…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="space-y-3 border-t border-glass-border px-5 py-4">
        {/* Lens selector: one horizontally-scrolling row, custom lens pinned right */}
        <div className="flex items-center gap-2">
          <div className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {wb.presetLenses.map((lens) => {
              const suggested = wb.suggestedLenses.includes(lens);
              const rank = wb.lensRanking.find((r) => r.lens === lens);
              const busy = wb.generatingLens === lens;
              return (
                <button
                  key={lens}
                  title={rank?.reason ?? "Generate through this lens"}
                  disabled={!!wb.generatingLens}
                  onClick={() => requestGeneration(lens, false)}
                  className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-all disabled:opacity-50 ${
                    suggested
                      ? "bg-primary text-primary-foreground shadow-lift"
                      : "glass-soft text-foreground hover:bg-accent/60"
                  }`}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : suggested ? (
                    <Sparkles className="size-3.5" />
                  ) : null}
                  {lens}
                </button>
              );
            })}
          </div>
          <button
            disabled={!!wb.generatingLens}
            onClick={() => setCustomOpen((v) => !v)}
            className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-primary/60 px-3 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
          >
            <Wand2 className="size-3.5" />
            Custom lens +
          </button>
        </div>

        {customOpen && (
          <div className="glass-soft space-y-2 rounded-xl px-3 py-3">
            <p className="text-sm font-medium">Where are you taking this document?</p>
            <p className="text-xs text-muted-foreground">
              Describe the room, audience or decision — that framing becomes the lens.
            </p>
            <div className="flex gap-2">
              <Input
                value={customLens}
                onChange={(e) => setCustomLens(e.target.value)}
                placeholder="e.g. Board sub-committee reviewing Q3 spend overrun"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customLens.trim()) {
                    requestGeneration(customLens.trim(), true);
                    setCustomLens("");
                    setCustomOpen(false);
                  }
                }}
              />
              <Button
                disabled={!customLens.trim() || !!wb.generatingLens}
                onClick={() => {
                  requestGeneration(customLens.trim(), true);
                  setCustomLens("");
                  setCustomOpen(false);
                }}
              >
                Frame it
              </Button>
            </div>
          </div>
        )}

        {advisoryFor && (
          <div className="glass-soft space-y-2 rounded-xl border-advisory/50 px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-advisory">
              <TriangleAlert className="size-4" /> Conflict Advisory
            </div>
            <p className="text-xs text-muted-foreground">
              {wb.unresolved.length} unresolved conflict{wb.unresolved.length === 1 ? "" : "s"} in
              the pool. You can generate anyway — the artifact will carry a visible caveat so
              readers know.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  void wb.generate(advisoryFor.lens, advisoryFor.isCustom);
                  setAdvisoryFor(null);
                }}
              >
                Generate anyway
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdvisoryFor(null)}>
                <X className="size-3.5" /> Review conflicts first
              </Button>
            </div>
          </div>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const q = draft.trim();
            if (!q || wb.thinking) return;
            setDraft("");
            void wb.sendMessage(q);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the source pool a question…"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || wb.thinking}>
            <Send className="size-4" />
          </Button>
        </form>

        {wb.generatingLens && (
          <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
            <Loader2 className="size-3 animate-spin" /> Composing "{wb.generatingLens}" poster
          </Badge>
        )}
      </div>
    </section>
  );
}
