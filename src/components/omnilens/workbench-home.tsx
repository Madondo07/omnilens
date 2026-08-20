import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  Layers,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Workbench } from "@/lib/use-workbench";

export function WorkbenchHome({
  wb,
  onOpenChat,
}: {
  wb: Workbench;
  onOpenChat: (sessionId: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const sourcesCount = wb.sources.length;
  const conflictsResolved = wb.conflicts.filter((c) => c.status === "resolved").length;
  const generationsCount = wb.generations.length;

  // Most-used lens
  const lensCounts = new Map<string, number>();
  for (const g of wb.generations) {
    lensCounts.set(g.lens, (lensCounts.get(g.lens) ?? 0) + 1);
  }
  const topLens = [...lensCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="glass-soft rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="size-4" />
            <span className="label-mono">Sources</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{sourcesCount}</p>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TriangleAlert className="size-4" />
            <span className="label-mono">Resolved</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{conflictsResolved}</p>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="size-4" />
            <span className="label-mono">Generations</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{generationsCount}</p>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="size-4" />
            <span className="label-mono">Top lens</span>
          </div>
          <p className="mt-1 truncate text-lg font-semibold tracking-tight">{topLens}</p>
        </div>
      </div>

      {/* Activity link */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/activity">
            <BarChart3 className="size-4" />
            View full activity history
          </Link>
        </Button>
      </div>

      {/* Chat sessions grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your chats</h2>

        {!wb.chatSessions.length ? (
          <div className="glass-soft flex flex-col items-center gap-3 rounded-xl px-6 py-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No chats yet. Start a new chat to query your sources and generate artifacts.
            </p>
            <Button
              onClick={() => {
                const id = wb.createChat();
                onOpenChat(id);
              }}
            >
              <Plus className="size-4" />
              Start your first chat
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <button
              onClick={() => {
                const id = wb.createChat();
                onOpenChat(id);
              }}
              className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-5 text-center transition-colors hover:bg-accent/30"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="size-5" />
              </span>
              <span className="text-sm font-medium">New chat</span>
            </button>

            {wb.chatSessions.map((session) => {
              const sourceCount = session.focusedSourceIds.length;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isEditing && onOpenChat(session.id)}
                  onKeyDown={(e) => {
                    if (!isEditing && (e.key === "Enter" || e.key === " ")) onOpenChat(session.id);
                  }}
                  className="glass-soft group flex min-h-[160px] cursor-pointer flex-col rounded-2xl p-5 text-left transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/40 text-xl leading-none">
                      {session.emoji}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-1.5 -mt-1.5 size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditName(session.name);
                            setEditingId(session.id);
                          }}
                        >
                          <Pencil className="size-3.5" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => wb.deleteChat(session.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex-1">
                    {isEditing ? (
                      <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={(e) => {
                          e.preventDefault();
                          wb.renameChat(session.id, editName);
                          setEditingId(null);
                        }}
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onBlur={() => {
                            wb.renameChat(session.id, editName);
                            setEditingId(null);
                          }}
                        />
                      </form>
                    ) : (
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {session.name}
                      </p>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" · "}
                    {sourceCount} source{sourceCount === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
