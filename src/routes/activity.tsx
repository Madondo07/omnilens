import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Layers,
  Loader2,
  MessageSquare,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AppHeader } from "@/components/omnilens/app-header";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/use-auth";
import {
  fetchActivity,
  ACTIVITY_LABELS,
  type ActivityEvent,
  type ActivityKind,
} from "@/lib/activity";

const TITLE = "Activity & Stats — OmniLens AI";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [{ title: TITLE }],
  }),
  component: ActivityPage,
});

const EVENT_ICON: Record<ActivityKind, React.ReactNode> = {
  source_added: <FileText className="size-4 text-primary" />,
  source_removed: <FileText className="size-4 text-destructive" />,
  conflict_found: <TriangleAlert className="size-4 text-advisory" />,
  conflict_resolved: <CheckCircle2 className="size-4 text-verified" />,
  artifact_generated: <Sparkles className="size-4 text-primary" />,
  artifact_exported: <Download className="size-4 text-primary" />,
  chat_query: <MessageSquare className="size-4 text-muted-foreground" />,
};

function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!authLoading && !user) void navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    void fetchActivity(200)
      .then(setEvents)
      .catch((err) => console.error("Failed to load activity:", err))
      .finally(() => setLoading(false));
  }, [user]);

  // Compute stats from events
  const sourcesCount = events.filter((e) => e.kind === "source_added").length;
  const resolvedCount = events.filter((e) => e.kind === "conflict_resolved").length;
  const generationsCount = events.filter((e) => e.kind === "artifact_generated").length;

  const lensCounts = new Map<string, number>();
  for (const e of events) {
    if (e.lens) lensCounts.set(e.lens, (lensCounts.get(e.lens) ?? 0) + 1);
  }
  const topLens = [...lensCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  if (authLoading || loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="flex min-h-screen flex-col gap-3 p-3 lg:p-4">
      <AppHeader />

      <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Activity & Stats</h1>
        </div>

        {/* Stats cards */}
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
              <CheckCircle2 className="size-4" />
              <span className="label-mono">Resolved</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{resolvedCount}</p>
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

        {/* Usage tip */}
        <div className="glass-soft flex items-start gap-3 rounded-xl px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Uploading multiple related sources helps OmniLens detect potential conflicts and
            synthesize more comprehensive insights across your documents.
          </p>
        </div>

        {/* Activity Log */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Activity History</h2>

          {events.length === 0 ? (
            <div className="glass-soft flex flex-col items-center gap-3 rounded-xl px-6 py-12 text-center">
              <BarChart3 className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No activity recorded yet. Upload a source or start a chat to see your history here.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="glass-soft flex items-start gap-3 rounded-lg px-4 py-3"
                  >
                    <div className="mt-0.5 shrink-0">
                      {EVENT_ICON[event.kind] ?? <Info className="size-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{event.title}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      {event.detail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                      )}
                      {event.lens && (
                        <Badge variant="outline" className="mt-1.5 label-mono">
                          {event.lens}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </main>
  );
}
