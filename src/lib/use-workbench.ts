import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { analyzeSource, chatQuery, detectConflicts, generatePoster } from "./omnilens.functions";
import { extractText, hashSourceSet } from "./extract-text";
import { autoName, pickChatEmoji } from "./chat-naming";
import {
  PRESET_LENSES,
  type ChatMessage,
  type ChatSession,
  type Conflict,
  type Generation,
  type LensRank,
  type Source,
} from "./omnilens.types";

const STORAGE_KEY = "omnilens-workbench-v2";

type Persisted = {
  sources: Source[];
  conflicts: Conflict[];
  lensRanking: LensRank[];
  generations: Generation[];
  activeGenerationKey: string | null;
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
  /** @deprecated v1 migration fallback */
  messages?: ChatMessage[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

function createEmptySession(): ChatSession {
  return {
    id: uid(),
    name: "New chat",
    emoji: pickChatEmoji(""),
    messages: [],
    focusedSourceIds: [],
    linkedGenerationKeys: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useWorkbench() {
  const [hydrated, setHydrated] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lensRanking, setLensRanking] = useState<LensRank[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeGenerationKey, setActiveGenerationKey] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generatingLens, setGeneratingLens] = useState<string | null>(null);
  const [compareKey, setCompareKey] = useState<string | null>(null);

  const analyze = useServerFn(analyzeSource);
  const scan = useServerFn(detectConflicts);
  const ask = useServerFn(chatQuery);
  const makePoster = useServerFn(generatePoster);

  // --- Hydration (with v1 migration) ---
  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      // Migrate from v1
      if (!raw) {
        const v1 = localStorage.getItem("omnilens-workbench-v1");
        if (v1) {
          raw = v1;
          localStorage.removeItem("omnilens-workbench-v1");
        }
      }
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setSources(p.sources ?? []);
        setConflicts(p.conflicts ?? []);
        setLensRanking(p.lensRanking ?? []);
        // Backfill fields for generations persisted before they existed.
        setGenerations(
          (p.generations ?? []).map((g) => ({
            ...g,
            title: g.title ?? (g.isCustom ? "Executive Poster" : `${g.lens} Executive Poster`),
            completenessNote: g.completenessNote ?? "",
          })),
        );
        setActiveGenerationKey(p.activeGenerationKey ?? null);

        if (p.chatSessions?.length) {
          // Backfill emoji for sessions persisted before the field existed.
          setChatSessions(
            p.chatSessions.map((s) => ({ ...s, emoji: s.emoji ?? pickChatEmoji(s.name) })),
          );
          setActiveChatSessionId(p.activeChatSessionId ?? p.chatSessions[0]?.id ?? null);
        } else if (p.messages?.length) {
          // Migrate v1 flat messages to a session
          const firstUserMsg =
            p.messages.find((m) => m.role === "user")?.content ?? "Imported chat";
          const session: ChatSession = {
            id: uid(),
            name: autoName(firstUserMsg),
            emoji: pickChatEmoji(firstUserMsg),
            messages: p.messages,
            focusedSourceIds: [],
            linkedGenerationKeys: (p.generations ?? []).map((g) => g.key),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setChatSessions([session]);
          setActiveChatSessionId(session.id);
        }
      }
    } catch {
      /* ignore corrupt cache */
    }
    setHydrated(true);
  }, []);

  // --- Persistence ---
  const stateRef = useRef<Persisted | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = {
      sources,
      conflicts,
      lensRanking,
      generations,
      activeGenerationKey,
      chatSessions: chatSessions.map((s) => ({
        ...s,
        messages: s.messages.filter((m) => !m.pending),
      })),
      activeChatSessionId,
    };
    stateRef.current = payload;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota — keep working in memory */
    }
  }, [
    hydrated,
    sources,
    conflicts,
    lensRanking,
    generations,
    activeGenerationKey,
    chatSessions,
    activeChatSessionId,
  ]);

  // --- Derived ---
  const unresolved = conflicts.filter((c) => c.status === "unresolved");

  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId) ?? null;
  const messages = activeSession?.messages ?? [];
  const focusedSourceIds = activeSession?.focusedSourceIds ?? [];

  /**
   * Sources visible to THIS chat's AI calls. The account-wide pool is shared
   * (every source is listed and selectable in the Sources panel from any
   * chat), but a session only pulls sources into its own context once it has
   * uploaded or explicitly focused them — a brand-new chat never silently
   * inherits another chat's files.
   */
  const effectiveSources = sources.filter((s) => focusedSourceIds.includes(s.id));

  /** Hash of THIS chat's focused source set — drives generation cache keys and staleness. */
  const currentHash = hashSourceSet(effectiveSources.map((s) => s.id));

  // --- Chat session management ---
  const createChat = useCallback(() => {
    const session = createEmptySession();
    setChatSessions((prev) => [session, ...prev]);
    setActiveChatSessionId(session.id);
    setActiveGenerationKey(null);
    return session.id;
  }, []);

  const switchChat = useCallback((id: string) => {
    setActiveChatSessionId(id);
    setActiveGenerationKey(null);
  }, []);

  const renameChat = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: trimmed || s.name,
              emoji: trimmed ? pickChatEmoji(trimmed) : s.emoji,
              updatedAt: Date.now(),
            }
          : s,
      ),
    );
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setChatSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (activeChatSessionId === id) {
          setActiveChatSessionId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [activeChatSessionId],
  );

  // --- Source focus ---
  const toggleSourceFocus = useCallback(
    (sourceId: string) => {
      if (!activeChatSessionId) return;
      setChatSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeChatSessionId) return s;
          const ids = s.focusedSourceIds.includes(sourceId)
            ? s.focusedSourceIds.filter((id) => id !== sourceId)
            : [...s.focusedSourceIds, sourceId];
          return { ...s, focusedSourceIds: ids, updatedAt: Date.now() };
        }),
      );
    },
    [activeChatSessionId],
  );

  // --- Conflict scanning ---
  const rescan = useCallback(
    async (pool: Source[]) => {
      if (pool.length < 2) {
        setConflicts([]);
        setSources((prev) =>
          prev.map((s) => ({ ...s, status: s.claims.length ? "clean" : "unclassified" })),
        );
        return;
      }
      setScanning(true);
      try {
        const res = await scan({
          data: {
            sources: pool.map((s) => ({
              filename: s.filename,
              claims: s.claims.map((c) => ({ text: c.text, type: c.type })),
            })),
          },
        });
        const found: Conflict[] = res.conflicts.map((c) => ({
          ...c,
          id: uid(),
          status: "unresolved" as const,
        }));
        setConflicts((prev) => {
          const resolvedNotes = new Map(
            prev.filter((p) => p.status === "resolved").map((p) => [p.claimA + p.claimB, p]),
          );
          return found.map((f) => {
            const prior = resolvedNotes.get(f.claimA + f.claimB);
            return prior ? { ...f, status: prior.status, resolutionNote: prior.resolutionNote } : f;
          });
        });
        const flagged = new Set(found.flatMap((c) => [c.sourceA, c.sourceB]));
        setSources((prev) =>
          prev.map((s) => ({
            ...s,
            status: !s.claims.length
              ? "unclassified"
              : flagged.has(s.filename)
                ? "conflict"
                : "clean",
          })),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Conflict scan failed");
      } finally {
        setScanning(false);
      }
    },
    [scan],
  );

  // --- File ingestion ---
  const addFiles = useCallback(
    async (files: File[]) => {
      const accepted = files.filter((f) => /\.(pdf|md|txt|docx)$/i.test(f.name));
      const rejected = files.length - accepted.length;
      if (rejected > 0) toast.info(`${rejected} file(s) skipped — only .pdf, .md, .txt, .docx`);
      if (!accepted.length) return;

      // Uploads always land in the active chat's own context — create one if needed.
      const sessionId = activeChatSessionId ?? createChat();

      setIngesting((p) => [...p, ...accepted.map((f) => f.name)]);
      const added: Source[] = [];
      let firstTitle: string | null = null;

      for (const file of accepted) {
        try {
          const content = (await extractText(file)).trim();
          if (!content) throw new Error("No readable text found");
          const result = await analyze({ data: { filename: file.name, content } });
          const source: Source = {
            id: uid(),
            filename: file.name,
            content,
            uploadedAt: Date.now(),
            claims: result.claims.map((c) => ({ ...c, id: uid() })),
            status: result.claims.length ? "clean" : "unclassified",
          };
          added.push(source);
          firstTitle ??= result.title;
          setSources((prev) => [...prev, source]);
          setLensRanking(result.lensRanking as LensRank[]);
        } catch (err) {
          console.error("[omnilens] ingest failed", err);
          toast.error(`${file.name}: ${err instanceof Error ? err.message : "could not be read"}`);
        } finally {
          setIngesting((p) => p.filter((n) => n !== file.name));
        }
      }

      if (added.length) {
        const pool = [...(stateRef.current?.sources ?? sources), ...added];
        const addedIds = added.map((s) => s.id);
        setChatSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            const next = {
              ...s,
              focusedSourceIds: [...s.focusedSourceIds, ...addedIds],
              updatedAt: Date.now(),
            };
            // Name the chat after what was uploaded, not the first question asked —
            // but only the first time, so it doesn't clobber a session already in use.
            if (s.name === "New chat" && firstTitle) {
              next.name = firstTitle;
              next.emoji = pickChatEmoji(firstTitle);
            }
            return next;
          }),
        );
        await rescan(pool);
      }
    },
    [activeChatSessionId, analyze, createChat, rescan, sources],
  );

  const removeSource = useCallback(
    async (id: string) => {
      const pool = sources.filter((s) => s.id !== id);
      setSources(pool);
      await rescan(pool);
    },
    [rescan, sources],
  );

  const resolveConflict = useCallback((id: string, note: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "resolved", resolutionNote: note || undefined } : c,
      ),
    );
    setSources((prev) => prev.map((s) => s));
  }, []);

  useEffect(() => {
    // keep source chips in sync with resolution state
    const flagged = new Set(
      conflicts.filter((c) => c.status === "unresolved").flatMap((c) => [c.sourceA, c.sourceB]),
    );
    setSources((prev) =>
      prev.map((s) => {
        const next: Source["status"] = !s.claims.length
          ? "unclassified"
          : flagged.has(s.filename)
            ? "conflict"
            : "clean";
        return next === s.status ? s : { ...s, status: next };
      }),
    );
  }, [conflicts]);

  // --- Helpers for updating session messages ---
  const pushMessage = useCallback(
    (msg: ChatMessage) => {
      if (!activeChatSessionId) return;
      setChatSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeChatSessionId) return s;
          const updated = {
            ...s,
            messages: [...s.messages, msg],
            updatedAt: Date.now(),
          };
          // Fallback naming from the first question — only if no source has
          // already named this chat after what was actually uploaded.
          if (
            s.name === "New chat" &&
            msg.role === "user" &&
            s.messages.filter((m) => m.role === "user").length === 0
          ) {
            updated.name = autoName(msg.content);
            updated.emoji = pickChatEmoji(msg.content);
          }
          return updated;
        }),
      );
    },
    [activeChatSessionId],
  );

  // --- Chat ---
  const sendMessage = useCallback(
    async (question: string) => {
      // Ensure there's an active session
      let sessionId = activeChatSessionId;
      if (!sessionId) {
        sessionId = createChat();
      }

      const userMsg: ChatMessage = { id: uid(), role: "user", content: question };
      pushMessage(userMsg);

      if (!sources.length) {
        pushMessage({
          id: uid(),
          role: "assistant",
          content:
            "No sources in the pool yet — upload a document on the left and I'll ground every answer in it.",
        });
        return;
      }

      if (!effectiveSources.length) {
        pushMessage({
          id: uid(),
          role: "assistant",
          content:
            "This chat doesn't have any sources focused yet. Check some in the Sources panel on the left, or upload a new document, and I'll ground every answer in them.",
        });
        return;
      }

      setThinking(true);
      try {
        // What's currently shown in the artifact pane — lets the assistant explain
        // its own output (e.g. the completeness score), not just the source text.
        const activeGen =
          generations.find((g) => g.key === activeGenerationKey) ??
          generations[generations.length - 1] ??
          null;

        const res = await ask({
          data: {
            question,
            sources: effectiveSources.map((s) => ({ filename: s.filename, content: s.content })),
            history: messages
              .filter((m) => !m.pending)
              .map((m) => ({ role: m.role, content: m.content })),
            appContext: {
              activeGeneration: activeGen
                ? {
                    title: activeGen.title,
                    lens: activeGen.lens,
                    isCustom: activeGen.isCustom,
                    completenessScore: activeGen.completenessScore,
                    completenessNote: activeGen.completenessNote,
                    sectionHeadings: activeGen.sections.map((s) => s.heading),
                  }
                : null,
            },
          },
        });
        pushMessage({ id: uid(), role: "assistant", content: res.answer });
      } catch (err) {
        pushMessage({
          id: uid(),
          role: "assistant",
          content: `I couldn't reach the reasoning service: ${
            err instanceof Error ? err.message : "unknown error"
          }`,
        });
      } finally {
        setThinking(false);
      }
    },
    [
      activeChatSessionId,
      activeGenerationKey,
      ask,
      createChat,
      effectiveSources,
      generations,
      messages,
      pushMessage,
      sources,
    ],
  );

  // --- Generation ---
  const generate = useCallback(
    async (lens: string, isCustom: boolean) => {
      if (!sources.length) {
        toast.info("Add at least one source before generating.");
        return;
      }
      if (!effectiveSources.length) {
        toast.info(
          "Focus at least one source for this chat before generating — check some in the Sources panel.",
        );
        return;
      }
      const key = `${lens}::executive-poster::${currentHash}`;
      const cached = generations.find((g) => g.key === key);
      if (cached) {
        setActiveGenerationKey(key);
        toast.info(`Showing cached version for "${lens}".`);
        return;
      }
      setGeneratingLens(lens);
      try {
        const res = await makePoster({
          data: {
            lens,
            isCustom,
            sources: effectiveSources.map((s) => ({ filename: s.filename, content: s.content })),
            conflicts: unresolved.map((c) => ({
              claimA: c.claimA,
              sourceA: c.sourceA,
              claimB: c.claimB,
              sourceB: c.sourceB,
              explanation: c.explanation,
            })),
          },
        });
        const gen: Generation = {
          key,
          lens,
          isCustom,
          artifactType: "executive-poster",
          sourceSetHash: currentHash,
          createdAt: Date.now(),
          title: res.title,
          brief: res.brief,
          sections: res.sections,
          completenessScore: res.completenessScore,
          completenessNote: res.completenessNote,
          unresolvedConflictCount: unresolved.length,
        };
        setGenerations((prev) => [...prev, gen]);
        setActiveGenerationKey(key);

        // Link generation to active session
        if (activeChatSessionId) {
          setChatSessions((prev) =>
            prev.map((s) =>
              s.id === activeChatSessionId
                ? {
                    ...s,
                    linkedGenerationKeys: [...s.linkedGenerationKeys, key],
                    updatedAt: Date.now(),
                  }
                : s,
            ),
          );
        }

        pushMessage({
          id: uid(),
          role: "assistant",
          content: `Generated "${res.title}"${isCustom ? "" : ` through the ${lens} lens`}${
            unresolved.length ? ` with ${unresolved.length} unresolved conflict noted` : ""
          }. It's on the right — earlier lens versions stay cached.`,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setGeneratingLens(null);
      }
    },
    [
      activeChatSessionId,
      currentHash,
      effectiveSources,
      generations,
      makePoster,
      pushMessage,
      sources,
      unresolved,
    ],
  );

  const activeGeneration =
    generations.find((g) => g.key === activeGenerationKey) ??
    generations[generations.length - 1] ??
    null;

  const suggestedLenses = [...lensRanking]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((l) => l.lens);

  return {
    hydrated,
    sources,
    conflicts,
    unresolved,
    lensRanking,
    presetLenses: PRESET_LENSES,
    suggestedLenses,
    generations,
    activeGeneration,
    setActiveGenerationKey,
    // Chat sessions
    chatSessions,
    activeChatSessionId,
    activeSession,
    messages,
    createChat,
    switchChat,
    renameChat,
    deleteChat,
    // Source focus
    focusedSourceIds,
    toggleSourceFocus,
    effectiveSources,
    // State
    ingesting,
    scanning,
    thinking,
    generatingLens,
    currentHash,
    // Actions
    addFiles,
    removeSource,
    resolveConflict,
    sendMessage,
    generate,
    // Comparison
    compareKey,
    setCompareKey,
  };
}

export type Workbench = ReturnType<typeof useWorkbench>;
