# OmniLens Workbench

Build a web app called OmniLens AI — a source-grounded project intelligence workbench with a three-pane layout: Sources (left) | Chat (center) | Generated Content (right), similar to Claude's artifact interface.

Core concept: Users upload project documents that become an immutable shared source pool. The app detects contradictions across sources (dates, budgets, technical architecture) and generates department-specific artifacts from the verified content — without ever modifying the original sources.

MVP scope:

File upload only (.pdf, .md, .txt, .docx) — no live URL ingestion

One artifact type only: 1-Page Executive Poster (a Markdown table with columns Metrics | Targets | Risks | Owners, plus a short summary brief)

Hard-conflict detection only (contradictory dates, numbers, named technologies/architecture terms across sources) — no soft/semantic conflict detection

Lens system (revised):

Five preset lenses are available: Executive, IT/Engineering, HR/People Ops, Sales/GTM, Support/Operations

After a document is read, the app should suggest which lenses are most relevant to that specific content (e.g. a pure architecture spec might surface IT and Executive as top suggestions, deprioritizing Sales) — this is a suggestion/ranking, not a hard restriction; all 5 remain selectable

Users can also define a custom lens at any time by answering a simple prompt: "Where are you taking this document?" — their free-text answer becomes the lens framing for that generation, instead of picking a preset

The lens selector in the center pane should support both: pick a preset (with the suggested ones visually highlighted) or type a custom framing

Data model:

Source: id, filename, raw content (read-only/immutable), extracted claims (each tagged as date, budget, architecture, or scope), upload timestamp

Conflict: claim A + source A, claim B + source B, conflict type, status (unresolved/resolved), optional resolution note — conflicts are detected once against the shared pool, not per lens

Generation: keyed by (lens, artifact_type, source_set_hash) — where lens can be a preset name or a custom free-text framing; each combination is cached as its own version, never overwritten

State flow:

On upload, extract claims from each source into the shared pool

Automatically scan the pool for hard conflicts (no user action needed)

Automatically rank the 5 preset lenses by relevance to the ingested content (shown as suggested/highlighted, not enforced)

Chat can query sources freely at any time — no gating, answers pull directly from the pool

Chat can request generation — pick a suggested lens, any preset lens, or answer "where are you taking this document?" to create a custom lens

If unresolved conflicts exist at generation time, show a soft warning (Conflict Advisory) that the user can dismiss/override, not a hard block

If generated while a conflict was unresolved, show a persistent visible caveat on the artifact itself (e.g. footer line: "⚠ Generated with 1 unresolved conflict — see Source Advisory")

Switching lenses (including custom ones) regenerates content, but every previous lens's output is kept and cached, accessible via a version/lens selector on the right pane — never discarded

If sources are added/changed after a version was generated, do not auto-invalidate cached versions — flag them as stale with a banner, let the user decide whether to regenerate

Layout details:

Left pane: list of uploaded sources with a status chip per source (Clean / Conflict / Unclassified); clicking a source shows its raw read-only content

Center pane: chat interface with a lens control showing the 5 presets (top-ranked ones highlighted based on document content) plus a "custom lens" option that opens the "where are you taking this document?" prompt

Right pane: renders the generated poster for the active lens, with a version selector across all cached lenses (preset and custom), and stale/conflict caveat banners when applicable

Explicitly do not build: live URL ingestion, additional artifact types (decks, flashcards, SOPs), semantic/soft conflict detection, analytics dashboards. These are post-MVP.

Tone/UX: Treat conflicts and staleness as informative states, not errors — the interface should feel like a careful research assistant flagging things for a human decision, never blocking work outright, give it a glassy feel with semi model designs (add the obvious dark and light mode features). Lens suggestions should feel like helpful defaults, not restrictions — the custom lens option should be just as prominent as the presets.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://omnilens.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b7beb539-2af9-478a-8b45-16b54bb4258b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
