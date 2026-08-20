import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Workbench } from "@/lib/use-workbench";
import type { Source } from "@/lib/omnilens.types";

const chip = {
  clean: { label: "Clean", icon: CheckCircle2, className: "border-verified/40 text-verified" },
  conflict: {
    label: "Conflict",
    icon: TriangleAlert,
    className: "border-advisory/50 text-advisory",
  },
  unclassified: {
    label: "Unclassified",
    icon: HelpCircle,
    className: "border-border text-muted-foreground",
  },
} as const;

export function SourcesPane({
  wb,
  collapsed = false,
  onToggleCollapse,
}: {
  wb: Workbench;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<Source | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (collapsed) {
    return (
      <aside className="pane w-full shrink-0 flex-row items-center gap-3 px-3 py-2 lg:w-14 lg:flex-col lg:py-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expand source pool"
          title="Expand source pool"
          onClick={onToggleCollapse}
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        <FileText className="size-4 text-muted-foreground" />
        <span className="label-mono lg:[writing-mode:vertical-rl]">
          {wb.sources.length} source{wb.sources.length === 1 ? "" : "s"}
        </span>
        {wb.unresolved.length > 0 && <TriangleAlert className="size-4 text-advisory" />}
      </aside>
    );
  }

  return (
    <aside className="pane w-full lg:w-[22rem] shrink-0">
      <header className="flex items-center justify-between gap-2 border-b border-glass-border px-4 py-3">
        <div>
          <p className="label-mono">Source pool</p>
          <p className="text-sm font-medium">Immutable · {wb.sources.length} document(s)</p>
        </div>
        <div className="flex items-center gap-1">
          {wb.scanning && <Loader2 className="size-4 animate-spin text-primary" />}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Collapse source pool"
            title="Collapse source pool"
            onClick={onToggleCollapse}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
      </header>


      <div className="px-4 pt-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void wb.addFiles(Array.from(e.dataTransfer.files));
          }}
          className={`glass-soft flex flex-col items-center gap-2 rounded-xl border-dashed px-4 py-6 text-center transition-colors ${
            dragging ? "border-primary bg-accent/40" : ""
          }`}
        >
          <Upload className="size-5 text-primary" />
          <p className="text-sm">Drop files or</p>
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
            Browse documents
          </Button>
          <p className="label-mono">.pdf · .md · .txt · .docx</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.md,.txt,.docx"
            className="hidden"
            onChange={(e) => {
              void wb.addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <ScrollArea className="mt-4 min-h-0 flex-1">
        <div className="space-y-2 px-4 pb-4">
          {wb.ingesting.map((name) => (
            <div key={name} className="glass-soft flex items-center gap-2 rounded-lg px-3 py-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="truncate text-sm text-muted-foreground">Reading {name}…</span>
            </div>
          ))}

          {wb.sources.map((s) => {
            const c = chip[s.status];
            const Icon = c.icon;
            return (
              <button
                key={s.id}
                onClick={() => setOpen(s)}
                className="glass-soft group w-full rounded-lg px-3 py-2.5 text-left transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.filename}</p>
                    <p className="label-mono mt-0.5">{s.claims.length} claims extracted</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 gap-1 ${c.className}`}>
                    <Icon className="size-3" />
                    {c.label}
                  </Badge>
                </div>
              </button>
            );
          })}

          {!wb.sources.length && !wb.ingesting.length && (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              Nothing in the pool yet. Uploaded documents are never modified — only read.
            </p>
          )}
        </div>

        {wb.conflicts.length > 0 && (
          <>
            <Separator className="bg-glass-border" />
            <div className="space-y-2 px-4 py-4">
              <p className="label-mono">Source advisory</p>
              {wb.conflicts.map((c) => (
                <div
                  key={c.id}
                  className={`glass-soft rounded-lg px-3 py-2.5 ${
                    c.status === "unresolved" ? "border-advisory/40" : "border-verified/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="label-mono border-border">
                      {c.type}
                    </Badge>
                    <span
                      className={`text-xs ${
                        c.status === "unresolved" ? "text-advisory" : "text-verified"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{c.explanation}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p>
                      <span className="label-mono">{c.sourceA}</span> — {c.claimA}
                    </p>
                    <p>
                      <span className="label-mono">{c.sourceB}</span> — {c.claimB}
                    </p>
                  </div>
                  {c.resolutionNote && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      Note: {c.resolutionNote}
                    </p>
                  )}
                  {c.status === "unresolved" && (
                    <div className="mt-2">
                      {noteFor === c.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Which version holds, and why?"
                            className="min-h-16 text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                wb.resolveConflict(c.id, note.trim());
                                setNote("");
                                setNoteFor(null);
                              }}
                            >
                              Mark resolved
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setNoteFor(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setNoteFor(c.id);
                            setNote("");
                          }}
                        >
                          Record a decision
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <div className="glass flex max-h-[80vh] w-full max-w-3xl flex-col rounded-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-glass-border px-5 py-3">
              <div className="min-w-0">
                <p className="label-mono">Read-only source</p>
                <p className="truncate text-sm font-medium">{open.filename}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove source"
                  onClick={() => {
                    void wb.removeSource(open.id);
                    setOpen(null);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <pre className="whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-relaxed">
                {open.content}
              </pre>
            </ScrollArea>
            {open.claims.length > 0 && (
              <div className="border-t border-glass-border px-5 py-3">
                <p className="label-mono mb-2">Extracted claims</p>
                <div className="flex flex-wrap gap-1.5">
                  {open.claims.map((c) => (
                    <Badge key={c.id} variant="outline" className="max-w-full">
                      <span className="label-mono mr-1">{c.type}</span>
                      <span className="truncate">{c.text}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
