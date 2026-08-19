import { createFileRoute } from "@tanstack/react-router";
import { Aperture, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";
import { ArtifactPane } from "@/components/omnilens/artifact-pane";
import { ChatPane } from "@/components/omnilens/chat-pane";
import { SourcesPane } from "@/components/omnilens/sources-pane";
import { ThemeToggle } from "@/components/omnilens/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkbench } from "@/lib/use-workbench";


const TITLE = "OmniLens AI — Source-Grounded Project Intelligence";
const DESC =
  "Upload project documents into an immutable source pool, surface hard contradictions across them, and generate lens-specific executive posters without touching the originals.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Workbench,
});

function Workbench() {
  const wb = useWorkbench();
  const [showSources, setShowSources] = useState(true);
  const [showArtifact, setShowArtifact] = useState(true);

  return (
    <main className="flex h-screen flex-col gap-3 p-3 lg:p-4">
      <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={showSources ? "Collapse sources panel" : "Expand sources panel"}
            title={showSources ? "Collapse sources" : "Expand sources"}
            onClick={() => setShowSources((v) => !v)}
          >
            {showSources ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
          <span className="glass-soft flex size-9 items-center justify-center rounded-xl">
            <Aperture className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight">OmniLens AI</h1>
            <p className="label-mono">Project intelligence workbench</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="label-mono">
            pool {wb.currentHash}
          </Badge>
          {wb.unresolved.length > 0 && (
            <Badge variant="outline" className="border-advisory/50 text-advisory">
              {wb.unresolved.length} unresolved conflict
              {wb.unresolved.length === 1 ? "" : "s"}
            </Badge>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={showArtifact ? "Collapse generated content panel" : "Expand generated content panel"}
            title={showArtifact ? "Collapse generated content" : "Expand generated content"}
            onClick={() => setShowArtifact((v) => !v)}
          >
            {showArtifact ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto lg:flex-row lg:overflow-hidden">
        {showSources && <SourcesPane wb={wb} />}
        <ChatPane wb={wb} />
        {showArtifact && <ArtifactPane wb={wb} />}
      </div>
    </main>
  );

}
