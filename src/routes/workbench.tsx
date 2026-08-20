import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/omnilens/app-header";
import { ArtifactPane } from "@/components/omnilens/artifact-pane";
import { ChatPane } from "@/components/omnilens/chat-pane";
import { SourcesPane } from "@/components/omnilens/sources-pane";
import { Badge } from "@/components/ui/badge";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/use-auth";
import { useWorkbench } from "@/lib/use-workbench";

const TITLE = "Workbench — OmniLens AI";
const DESC =
  "Upload project documents into an immutable source pool, review contradiction advisories and generate lens-specific executive posters.";

export const Route = createFileRoute("/workbench")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: WorkbenchPage,
});

function WorkbenchPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const wb = useWorkbench();
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [artifactCollapsed, setArtifactCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Workbench activity log — records what changed in the pool for the profile feed.
  const seen = useRef<{ sources: string[]; gens: string[]; conflicts: string[] } | null>(null);
  useEffect(() => {
    if (!user || !wb.hydrated) return;
    const snapshot = {
      sources: wb.sources.map((s) => s.id),
      gens: wb.generations.map((g) => g.key),
      conflicts: wb.conflicts.filter((c) => c.status === "resolved").map((c) => c.id),
    };
    const prev = seen.current;
    seen.current = snapshot;
    if (!prev) return;

    for (const id of snapshot.sources.filter((s) => !prev.sources.includes(s))) {
      const src = wb.sources.find((s) => s.id === id);
      if (src) {
        void logActivity({
          kind: "source_added",
          title: src.filename,
          detail: `${src.claims.length} claims extracted`,
        });
      }
    }
    for (const key of snapshot.gens.filter((g) => !prev.gens.includes(g))) {
      const gen = wb.generations.find((g) => g.key === key);
      if (gen) {
        void logActivity({
          kind: "artifact_generated",
          title: "1-Page Executive Poster",
          detail: `${gen.rows.length} rows · ${gen.unresolvedConflictCount} unresolved conflict(s)`,
          lens: gen.lens,
        });
      }
    }
    for (const id of snapshot.conflicts.filter((c) => !prev.conflicts.includes(c))) {
      const c = wb.conflicts.find((x) => x.id === id);
      if (c) {
        void logActivity({
          kind: "conflict_resolved",
          title: `${c.type} contradiction resolved`,
          detail: c.resolutionNote ?? c.explanation,
        });
      }
    }
  }, [user, wb.hydrated, wb.sources, wb.generations, wb.conflicts]);

  if (loading || !user) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col gap-3 p-3 lg:p-4">
      <AppHeader
        extras={
          <>
            <Badge variant="outline" className="label-mono">
              pool {wb.currentHash}
            </Badge>
            {wb.unresolved.length > 0 && (
              <Badge variant="outline" className="border-advisory/50 text-advisory">
                {wb.unresolved.length} unresolved conflict
                {wb.unresolved.length === 1 ? "" : "s"}
              </Badge>
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto lg:flex-row lg:overflow-hidden">
        <SourcesPane
          wb={wb}
          collapsed={sourcesCollapsed}
          onToggleCollapse={() => setSourcesCollapsed((v) => !v)}
        />
        <ChatPane wb={wb} />
        <ArtifactPane
          wb={wb}
          collapsed={artifactCollapsed}
          onToggleCollapse={() => setArtifactCollapsed((v) => !v)}
        />
      </div>
    </main>
  );
}
