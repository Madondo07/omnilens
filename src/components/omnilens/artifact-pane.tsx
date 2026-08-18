import { Check, Copy, History, Layers, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Workbench } from "@/lib/use-workbench";
import type { Generation } from "@/lib/omnilens.types";

function toMarkdown(gen: Generation, stale: boolean) {
  const head = `| Metrics | Targets | Risks | Owners |\n| --- | --- | --- | --- |`;
  const body = gen.rows
    .map((r) => `| ${r.metric} | ${r.target} | ${r.risk} | ${r.owner} |`)
    .join("\n");
  const caveats = [
    gen.unresolvedConflictCount
      ? `⚠ Generated with ${gen.unresolvedConflictCount} unresolved conflict${
          gen.unresolvedConflictCount === 1 ? "" : "s"
        } — see Source Advisory`
      : null,
    stale ? "⚠ Source pool changed since this version was generated" : null,
  ].filter(Boolean);
  return `# 1-Page Executive Poster — ${gen.lens}\n\n${gen.brief}\n\n${head}\n${body}\n${
    caveats.length ? `\n${caveats.map((c) => `_${c}_`).join("\n\n")}\n` : ""
  }`;
}

export function ArtifactPane({ wb }: { wb: Workbench }) {
  const [copied, setCopied] = useState(false);
  const gen = wb.activeGeneration;
  const stale = !!gen && gen.sourceSetHash !== wb.currentHash;

  return (
    <section className="pane w-full lg:w-[30rem] shrink-0">
      <header className="flex items-center justify-between gap-2 border-b border-glass-border px-4 py-3">
        <div className="min-w-0">
          <p className="label-mono">Generated content</p>
          <p className="truncate text-sm font-medium">
            {gen ? gen.lens : "No artifact yet"}
          </p>
        </div>
        {gen && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy markdown"
            onClick={() => {
              void navigator.clipboard.writeText(toMarkdown(gen, stale));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-4 text-verified" /> : <Copy className="size-4" />}
          </Button>
        )}
      </header>

      {wb.generations.length > 0 && (
        <div className="flex items-center gap-2 border-b border-glass-border px-4 py-2.5">
          <History className="size-4 shrink-0 text-muted-foreground" />
          <Select
            value={gen?.key ?? ""}
            onValueChange={(v) => wb.setActiveGenerationKey(v)}
          >
            <SelectTrigger className="h-9 flex-1 text-xs">
              <SelectValue placeholder="Cached lens versions" />
            </SelectTrigger>
            <SelectContent>
              {wb.generations.map((g) => (
                <SelectItem key={g.key} value={g.key} className="text-xs">
                  {g.isCustom ? "Custom · " : ""}
                  {g.lens} · {new Date(g.createdAt).toLocaleTimeString()}
                  {g.sourceSetHash !== wb.currentHash ? " · stale" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="label-mono shrink-0">
            {wb.generations.length} cached
          </Badge>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        {!gen ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Layers className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Pick a lens in the chat pane — preset or custom — and the poster appears here. Every
              lens version is kept, never overwritten.
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-4 py-4">
            {stale && (
              <div className="glass-soft rounded-xl border-primary/40 px-3 py-2.5 text-xs">
                <p className="font-medium">Source pool has changed</p>
                <p className="mt-1 text-muted-foreground">
                  This version is still valid as a record. Regenerate the same lens when you want
                  it refreshed — nothing is discarded.
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={!!wb.generatingLens}
                  onClick={() => void wb.generate(gen.lens, gen.isCustom)}
                >
                  Regenerate “{gen.lens}”
                </Button>
              </div>
            )}

            {gen.unresolvedConflictCount > 0 && (
              <div className="glass-soft rounded-xl border-advisory/50 px-3 py-2.5 text-xs">
                <p className="flex items-center gap-1.5 font-medium text-advisory">
                  <TriangleAlert className="size-3.5" /> Generated with{" "}
                  {gen.unresolvedConflictCount} unresolved conflict
                  {gen.unresolvedConflictCount === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Ambiguities are surfaced in the Risks column rather than silently decided.
                </p>
              </div>
            )}

            <article className="glass-soft rounded-xl px-4 py-4">
              <p className="label-mono">1-Page Executive Poster</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                {gen.isCustom ? gen.lens : `${gen.lens} lens`}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{gen.brief}</p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="text-left">
                      {["Metrics", "Targets", "Risks", "Owners"].map((h) => (
                        <th
                          key={h}
                          className="label-mono border-b border-glass-border pb-2 pr-3 font-normal"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gen.rows.map((r, i) => (
                      <tr key={i} className="align-top">
                        <td className="border-b border-glass-border py-2 pr-3 font-medium">
                          {r.metric}
                        </td>
                        <td className="border-b border-glass-border py-2 pr-3">{r.target}</td>
                        <td className="border-b border-glass-border py-2 pr-3 text-muted-foreground">
                          {r.risk}
                        </td>
                        <td className="border-b border-glass-border py-2">{r.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="mt-4 space-y-1 border-t border-glass-border pt-3">
                <p className="label-mono">
                  source set {gen.sourceSetHash} · {new Date(gen.createdAt).toLocaleString()}
                </p>
                {gen.unresolvedConflictCount > 0 && (
                  <p className="text-xs text-advisory">
                    ⚠ Generated with {gen.unresolvedConflictCount} unresolved conflict
                    {gen.unresolvedConflictCount === 1 ? "" : "s"} — see Source Advisory
                  </p>
                )}
              </footer>
            </article>
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
