import { supabase } from "@/integrations/supabase/client";

export type ActivityKind =
  | "source_added"
  | "source_removed"
  | "conflict_found"
  | "conflict_resolved"
  | "artifact_generated"
  | "artifact_exported"
  | "chat_query";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string | null;
  lens: string | null;
  created_at: string;
};

export async function logActivity(event: {
  kind: ActivityKind;
  title: string;
  detail?: string | null;
  lens?: string | null;
}) {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;
  await supabase.from("activity_events").insert({
    user_id: uid,
    kind: event.kind,
    title: event.title,
    detail: event.detail ?? null,
    lens: event.lens ?? null,
  });
}

export async function fetchActivity(limit = 100): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select("id, kind, title, detail, lens, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityEvent[];
}

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  source_added: "Source ingested",
  source_removed: "Source removed",
  conflict_found: "Conflict flagged",
  conflict_resolved: "Conflict resolved",
  artifact_generated: "Artifact generated",
  artifact_exported: "Artifact exported",
  chat_query: "Pool queried",
};
