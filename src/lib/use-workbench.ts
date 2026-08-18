import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  analyzeSource,
  chatQuery,
  detectConflicts,
  generatePoster,
} from "./omnilens.functions";
import { extractText, hashSourceSet } from "./extract-text";
import {
  PRESET_LENSES,
  type ChatMessage,
  type Conflict,
  type Generation,
  type LensRank,
  type Source,
} from "./omnilens.types";

const STORAGE_KEY = "omnilens-workbench-v1";

type Persisted = {
  sources: Source[];
  conflicts: Conflict[];
  lensRanking: LensRank[];
  generations: Generation[];
  activeGenerationKey: string | null;
  messages: ChatMessage[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function useWorkbench() {
  const [hydrated, setHydrated] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lensRanking, setLensRanking] = useState<LensRank[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeGenerationKey, setActiveGenerationKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ingesting, setIngesting] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generatingLens, setGeneratingLens] = useState<string | null>(null);

  const analyze = useServerFn(analyzeSource);
  const scan = useServerFn(detectConflicts);
  const ask = useServerFn(chatQuery);
  const makePoster = useServerFn(generatePoster);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setSources(p.sources ?? []);
        setConflicts(p.conflicts ?? []);
        setLensRanking(p.lensRanking ?? []);
        setGenerations(p.generations ?? []);
        setActiveGenerationKey(p.activeGenerationKey ?? null);
        setMessages(p.messages ?? []);
      }
    } catch {
      /* ignore corrupt cache */
    }
    setHydrated(true);
  }, []);

  const stateRef = useRef<Persisted | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = {
      sources,
      conflicts,
      lensRanking,
      generations,
      activeGenerationKey,
      messages: messages.filter((m) => !m.pending),
    };
    stateRef.current = payload;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota — keep working in memory */
    }
  }, [hydrated, sources, conflicts, lensRanking, generations, activeGenerationKey, messages]);

  const currentHash = hashSourceSet(sources.map((s) => s.id));
  const unresolved = conflicts.filter((c) => c.status === "unresolved");

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
            prev
              .filter((p) => p.status === "resolved")
              .map((p) => [p.claimA + p.claimB, p]),
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

  const addFiles = useCallback(
    async (files: File[]) => {
      const accepted = files.filter((f) => /\.(pdf|md|txt|docx)$/i.test(f.name));
      const rejected = files.length - accepted.length;
      if (rejected > 0) toast.info(`${rejected} file(s) skipped — only .pdf, .md, .txt, .docx`);
      if (!accepted.length) return;

      setIngesting((p) => [...p, ...accepted.map((f) => f.name)]);
      const added: Source[] = [];

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
          setSources((prev) => [...prev, source]);
          setLensRanking(result.lensRanking as LensRank[]);
        } catch (err) {
          toast.error(
            `${file.name}: ${err instanceof Error ? err.message : "could not be read"}`,
          );
        } finally {
          setIngesting((p) => p.filter((n) => n !== file.name));
        }
      }

      if (added.length) {
        const pool = [...(stateRef.current?.sources ?? sources), ...added];
        await rescan(pool);
      }
    },
    [analyze, rescan, sources],
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

  const sendMessage = useCallback(
    async (question: string) => {
      const userMsg: ChatMessage = { id: uid(), role: "user", content: question };
      setMessages((prev) => [...prev, userMsg]);
      if (!sources.length) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "No sources in the pool yet — upload a document on the left and I'll ground every answer in it.",
          },
        ]);
        return;
      }
      setThinking(true);
      try {
        const res = await ask({
          data: {
            question,
            sources: sources.map((s) => ({ filename: s.filename, content: s.content })),
            history: messages
              .filter((m) => !m.pending)
              .map((m) => ({ role: m.role, content: m.content })),
          },
        });
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: res.answer },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: `I couldn't reach the reasoning service: ${
              err instanceof Error ? err.message : "unknown error"
            }`,
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [ask, messages, sources],
  );

  const generate = useCallback(
    async (lens: string, isCustom: boolean) => {
      if (!sources.length) {
        toast.info("Add at least one source before generating.");
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
            sources: sources.map((s) => ({ filename: s.filename, content: s.content })),
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
          brief: res.brief,
          rows: res.rows,
          unresolvedConflictCount: unresolved.length,
        };
        setGenerations((prev) => [...prev, gen]);
        setActiveGenerationKey(key);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: `Generated a 1-Page Executive Poster through the **${lens}** lens${
              unresolved.length ? ` with ${unresolved.length} unresolved conflict noted` : ""
            }. It's on the right — earlier lens versions stay cached.`,
          },
        ]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setGeneratingLens(null);
      }
    },
    [currentHash, generations, makePoster, sources, unresolved],
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
    messages,
    ingesting,
    scanning,
    thinking,
    generatingLens,
    currentHash,
    addFiles,
    removeSource,
    resolveConflict,
    sendMessage,
    generate,
  };
}

export type Workbench = ReturnType<typeof useWorkbench>;
