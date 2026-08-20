# OmniLens AI

A source-grounded project intelligence workbench. Upload project documents into a shared, immutable source pool, automatically surface hard contradictions between them, and generate audience-specific "1-Page Executive Poster" artifacts — without ever rewriting or hallucinating past what the sources actually say.

## The problem it solves

Teams routinely rewrite the same project update by hand for every audience — a technical brief for engineering, a budget summary for finance, a rollout note for support — and in the process lose track of which version is authoritative, and let contradictions (a date here, a budget there) slip through unnoticed. OmniLens keeps one shared, read-only source pool per chat, flags hard contradictions across it automatically, and reframes the same verified content through a chosen "lens" (audience) on demand, caching every version so nothing is ever silently overwritten.

## Core features

- **Immutable source pool** — Upload `.pdf`, `.md`, `.txt`, or `.docx` files. Originals are parsed once and never modified; only read and cited.
- **Hard-conflict detection** — Automatically cross-references uploaded sources for directly contradictory dates, budgets, or named technical/architecture decisions. Soft or stylistic differences are ignored by design.
- **Lens-based generation** — Reframe the same source pool through five preset lenses (Executive, IT/Engineering, HR/People Ops, Sales/GTM, Support/Operations) or a free-text custom lens. Every generated version is cached and comparable side-by-side; nothing is overwritten when the pool changes — stale versions are flagged, not discarded.
- **Grounded chat** — Ask questions answered strictly from the focused sources, with inline citations. The assistant also understands the app's own output (e.g. it can explain what a poster's completeness score means and suggest concrete documents to close the gap), not just the raw source text.
- **Per-chat source isolation** — Each chat only pulls in the sources it uploaded or that were explicitly focused for it; a new chat never silently inherits another chat's files, even though the underlying pool is shared account-wide.
- **PDF export & Markdown copy** — Download a generated poster as a formatted PDF or copy it as clean Markdown, with only the actual document content — no app-only metadata (coverage score, cache hashes) leaks into the export.
- **Auto-naming** — Chats are automatically titled from what was uploaded (not the first question asked) and tagged with a topic-matched emoji.
- **Activity history & profile** — A running log of source uploads, conflict resolutions, and artifact generations, plus an editable user profile.
- **Auth** — Email/password and Google OAuth via Supabase Auth, including password reset and email confirmation flows.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (React, file-based routing, SSR) |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) primitives |
| Database & Auth | [Supabase](https://supabase.com) (Postgres + Row Level Security, GoTrue auth) |
| AI | [Google Gemini](https://ai.google.dev) via the [Vercel AI SDK](https://ai-sdk.dev) (`@ai-sdk/google`) — structured claim extraction, conflict detection, chat, and poster generation |
| Document parsing | `pdfjs-dist`, `mammoth` (`.docx`) |
| PDF export | `jspdf` |
| State | Local React state + `localStorage` persistence (no source content or chat messages are ever sent to the database — see [Data handling](#data-handling)) |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (Gemini)

### 1. Clone and install

```bash
git clone <this-repository-url>
cd omnilens
npm install
```

### 2. Configure environment variables

This project splits env vars across two files:

- **`.env`** — committed to the repo. Only `VITE_*` values, which are public/client-safe by design (they ship in the browser bundle either way) and which Lovable's build needs present to generate previews and published builds.
- **`.env.local`** — gitignored, local-dev-only. Real secrets go here; copy `.env.example`'s second half into it.

| Variable | File | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | `.env` | Supabase project ref |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `.env.local` | Gemini API key from Google AI Studio |

When deploying on Lovable, set `GOOGLE_GENERATIVE_AI_API_KEY` under **Cloud tab → Secrets** in your project — never commit it.

### 3. Set up the database

Apply the migrations in `supabase/migrations/` to your Supabase project (via the Supabase CLI or by pasting them into the SQL editor). They create the `profiles` and `activity_events` tables with Row Level Security policies scoping every row to its owner.

### 4. (Optional) Enable Google sign-in

Google OAuth uses Supabase's native provider. In your Supabase dashboard under **Authentication → Providers → Google**, add a Google Cloud OAuth Client ID/Secret with `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI. Email/password sign-in works without this step.

### 5. Run the dev server

```bash
npm run dev
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check-safe production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |

## Project structure

```
src/
├── routes/                  # File-based routes (/, /workbench, /auth, /profile, /activity)
├── components/
│   ├── omnilens/            # App-specific components (panes, header, landing page)
│   └── ui/                  # shadcn/ui primitives actually used by the app
├── lib/
│   ├── use-workbench.ts     # Core client-side state: sources, conflicts, chats, generations
│   ├── omnilens.server.ts   # AI calls (claim extraction, conflict detection, chat, poster generation)
│   ├── omnilens.functions.ts# Server function wrappers (validated with omnilens.schemas.ts)
│   ├── ai-gateway.server.ts # Gemini provider setup
│   └── export-pdf.ts        # PDF rendering for a generated poster
└── integrations/supabase/   # Supabase client (browser + service-role)
supabase/migrations/         # Database schema (profiles, activity_events, RLS policies)
```

## Data handling

Uploaded source content, chat messages, and generated artifacts are kept **client-side only** (in-memory and `localStorage`) — none of it is written to the Supabase database. Only lightweight activity metadata (an event kind, a title, a lens name) is persisted server-side, scoped to the signed-in user via Row Level Security. This is a deliberate design choice, not an oversight.

## Known limitations

- Conflict detection covers hard contradictions only (dates, budgets, named technologies/architecture, scope commitments) — no semantic/soft conflict detection.
- One artifact type (1-Page Executive Poster); no additional artifact types yet.
- Source content lives in `localStorage`, so it does not sync across devices or browsers for the same account.
