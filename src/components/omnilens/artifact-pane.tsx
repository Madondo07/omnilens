import {
  Check,
  Columns2,
  Copy,
  Download,
  History,
  Layers,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

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

/** Just the document itself — what gets copied/exported. No app-only metadata (coverage score, cache hash, staleness). */
function toMarkdown(gen: Generation) {
  let md = `# ${gen.title}\n\n${gen.brief}\n\n`;

  if (gen.sections?.length) {
    for (const sec of gen.sections) {
      md += `## ${sec.heading}\n\n`;
      for (const b of sec.bullets) {
        md += `- ${b}\n`;
      }
      md += "\n";
    }
  } else if (gen.rows?.length) {
    // Legacy table format
    md += `| Metrics | Targets | Risks | Owners |\n| --- | --- | --- | --- |\n`;
    for (const r of gen.rows) {
      md += `| ${r.metric} | ${r.target} | ${r.risk} | ${r.owner} |\n`;
    }
    md += "\n";
  }

  if (gen.unresolvedConflictCount) {
    md += `_⚠ Generated with ${gen.unresolvedConflictCount} unresolved conflict${
      gen.unresolvedConflictCount === 1 ? "" : "s"
    } — see Source Advisory_\n`;
  }

  return md;
}

/** The poster document itself — title, brief, sections only. No app chrome (coverage score, cache metadata, timestamps). */
function PosterContent({ gen }: { gen: Generation }) {
  return (
    <article className="glass-soft rounded-xl px-4 py-4">
      <p className="label-mono">1-Page Executive Poster</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">{gen.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{gen.brief}</p>

      {/* Sectioned prose format */}
      {gen.sections?.length ? (
        <div className="mt-4 space-y-4">
          {gen.sections.map((sec, i) => (
            <div key={i}>
              <h3 className="label-mono mb-1.5 text-foreground">{sec.heading}</h3>
              <ul className="space-y-1 pl-4">
                {sec.bullets.map((bullet, j) => (
                  <li key={j} className="list-disc text-sm leading-relaxed text-muted-foreground">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : gen.rows?.length ? (
        /* Legacy table fallback for old cached data */
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="label-mono mb-1.5 text-foreground">Key Metrics</h3>
            <ul className="space-y-1 pl-4">
              {gen.rows.map((r, i) => (
                <li key={i} className="list-disc text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{r.metric}</span> — Target:{" "}
                  {r.target}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="label-mono mb-1.5 text-foreground">Risks</h3>
            <ul className="space-y-1 pl-4">
              {gen.rows.map((r, i) => (
                <li key={i} className="list-disc text-sm leading-relaxed text-muted-foreground">
                  {r.risk}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="label-mono mb-1.5 text-foreground">Owners</h3>
            <ul className="space-y-1 pl-4">
              {gen.rows.map((r, i) => (
                <li key={i} className="list-disc text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{r.metric}</span> → {r.owner}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ArtifactPane({
  wb,
  collapsed = false,
  onToggleCollapse,
}: {
  wb: Workbench;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [comparing, setComparing] = useState(false);
  const gen = wb.activeGeneration;
  const stale = !!gen && gen.sourceSetHash !== wb.currentHash;

  const compareGen =
    comparing && wb.compareKey
      ? (wb.generations.find((g) => g.key === wb.compareKey) ?? null)
      : null;
  const compareStale = !!compareGen && compareGen.sourceSetHash !== wb.currentHash;

  async function downloadPdf() {
    if (!gen) return;
    setExporting(true);
    try {
      const { exportGenerationToPdf } = await import("@/lib/export-pdf");
      await exportGenerationToPdf(gen);
      void logActivity({
        kind: "artifact_exported",
        title: "Poster exported as PDF",
        lens: gen.lens,
      });
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Could not build the PDF.");
    } finally {
      setExporting(false);
    }
  }

  if (collapsed) {
    return (
      <section className="pane w-full shrink-0 flex-row items-center gap-3 px-3 py-2 lg:w-14 lg:flex-col lg:py-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expand generated content"
          title="Expand generated content"
          onClick={onToggleCollapse}
        >
          <PanelRightOpen className="size-4" />
        </Button>
        <Layers className="size-4 text-muted-foreground" />
        <span className="label-mono lg:[writing-mode:vertical-rl]">
          {wb.generations.length} artifact{wb.generations.length === 1 ? "" : "s"}
        </span>
      </section>
    );
  }

  return (
    <section className="pane w-full lg:w-[30rem] shrink-0">
      <header className="flex items-center justify-between gap-2 border-b border-glass-border px-4 py-3">
        <p className="label-mono">Generated Content</p>
        <div className="flex items-center gap-1">
          {gen && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Compare lenses side-by-side"
                title="Compare lenses"
                onClick={() => setComparing((v) => !v)}
                className={comparing ? "text-primary" : ""}
              >
                <Columns2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download as PDF"
                title="Download as PDF"
                disabled={exporting}
                onClick={() => void downloadPdf()}
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy markdown"
                title="Copy markdown"
                onClick={() => {
                  void navigator.clipboard.writeText(toMarkdown(gen));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check className="size-4 text-verified" /> : <Copy className="size-4" />}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Collapse generated content"
            title="Collapse generated content"
            onClick={onToggleCollapse}
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>
      </header>

      {/* Version selector */}
      <div className="flex items-center gap-2 border-b border-glass-border px-4 py-2.5">
        <History className="size-4 shrink-0 text-muted-foreground" />
        {wb.generations.length > 0 ? (
          <Select value={gen?.key ?? ""} onValueChange={(v) => wb.setActiveGenerationKey(v)}>
            <SelectTrigger className="h-9 min-w-0 flex-1 text-xs">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {wb.generations.map((g) => (
                <SelectItem key={g.key} value={g.key} className="text-xs">
                  {g.isCustom ? "Custom · " : ""}
                  {g.isCustom ? g.title : g.lens} · {new Date(g.createdAt).toLocaleTimeString()}
                  {g.sourceSetHash !== wb.currentHash ? " · stale" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground">No versions yet</span>
        )}
      </div>

      {/* Compare version selector */}
      {comparing && wb.generations.length > 1 && (
        <div className="flex items-center gap-2 border-b border-glass-border bg-accent/20 px-4 py-2">
          <Columns2 className="size-4 shrink-0 text-primary" />
          <Select value={wb.compareKey ?? ""} onValueChange={(v) => wb.setCompareKey(v)}>
            <SelectTrigger className="h-8 min-w-0 flex-1 text-xs">
              <SelectValue placeholder="Pick a version to compare" />
            </SelectTrigger>
            <SelectContent>
              {wb.generations
                .filter((g) => g.key !== gen?.key)
                .map((g) => (
                  <SelectItem key={g.key} value={g.key} className="text-xs">
                    {g.isCustom ? "Custom · " : ""}
                    {g.isCustom ? g.title : g.lens} · {new Date(g.createdAt).toLocaleTimeString()}
                    {g.sourceSetHash !== wb.currentHash ? " · stale" : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* App-only progress info — never part of the exported/copied document */}
      {gen && !comparing && (
        <div className="flex items-center gap-3 border-b border-glass-border px-4 py-2">
          <span className="label-mono shrink-0">Coverage</span>
          <div className="h-1.5 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${gen.completenessScore}%` }}
            />
          </div>
          <span className="label-mono shrink-0">{gen.completenessScore}%</span>
          <span className="label-mono shrink-0 text-muted-foreground">
            {new Date(gen.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        {!gen ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Layers className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No artifact yet</p>
            <p className="text-xs text-muted-foreground">
              Pick a lens in the chat pane — preset or custom — and the poster appears here. Every
              lens version is kept, never overwritten.
            </p>
          </div>
        ) : comparing && compareGen ? (
          /* Side-by-side comparison */
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="space-y-3">
              <Badge variant="outline" className="label-mono">
                {gen.isCustom ? gen.title : gen.lens}
              </Badge>
              <PosterContent gen={gen} />
            </div>
            <div className="space-y-3">
              <Badge variant="outline" className="label-mono">
                {compareGen.isCustom ? compareGen.title : compareGen.lens}
              </Badge>
              <PosterContent gen={compareGen} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4 py-4">
            {stale && (
              <div className="glass-soft rounded-xl border-primary/40 px-3 py-2.5 text-xs">
                <p className="font-medium">Source pool has changed</p>
                <p className="mt-1 text-muted-foreground">
                  This version is still valid as a record. Regenerate the same lens when you want it
                  refreshed — nothing is discarded.
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={!!wb.generatingLens}
                  onClick={() => void wb.generate(gen.lens, gen.isCustom)}
                >
                  Regenerate "{gen.isCustom ? gen.title : gen.lens}"
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
                  Ambiguities are surfaced in the Risks section rather than silently decided.
                </p>
              </div>
            )}

            <PosterContent gen={gen} />
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
