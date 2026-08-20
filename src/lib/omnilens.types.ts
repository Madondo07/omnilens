export type ClaimType = "date" | "budget" | "architecture" | "scope";

export type Claim = {
  id: string;
  text: string;
  type: ClaimType;
  excerpt?: string | undefined;
};

export type Source = {
  id: string;
  filename: string;
  content: string; // immutable raw content
  claims: Claim[];
  uploadedAt: number;
  status: "clean" | "conflict" | "unclassified";
};

export type ConflictType = "date" | "budget" | "architecture" | "scope";

export type Conflict = {
  id: string;
  type: ConflictType;
  claimA: string;
  sourceA: string; // filename
  claimB: string;
  sourceB: string;
  explanation: string;
  status: "unresolved" | "resolved";
  resolutionNote?: string | undefined;
};

export const PRESET_LENSES = [
  "Executive",
  "IT/Engineering",
  "HR/People Ops",
  "Sales/GTM",
  "Support/Operations",
] as const;

export type PresetLens = (typeof PRESET_LENSES)[number];

export type LensRank = { lens: PresetLens; score: number; reason: string };

/** A heading + bullet-point section inside a generated poster. */
export type GenerationSection = {
  heading: string;
  bullets: string[];
};

export type Generation = {
  key: string; // `${lens}::${artifactType}::${sourceSetHash}`
  lens: string;
  isCustom: boolean;
  artifactType: "executive-poster";
  sourceSetHash: string;
  createdAt: number;
  /** AI-authored document title — never the raw lens/prompt text. */
  title: string;
  brief: string;
  sections: GenerationSection[];
  completenessScore: number; // 0–100
  /** Why the score isn't 100 — what's thin or missing, so the chat can explain and suggest next steps. */
  completenessNote: string;
  unresolvedConflictCount: number;
  /** @deprecated kept only for rendering legacy cached data */
  rows?: { metric: string; target: string; risk: string; owner: string }[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[] | undefined;
  pending?: boolean | undefined;
};

/** A named, resumable chat session (NotebookLM-style). */
export type ChatSession = {
  id: string;
  name: string; // auto-generated from first message, editable
  emoji: string; // topic-matched emoji, NotebookLM-style
  messages: ChatMessage[];
  focusedSourceIds: string[]; // empty = use full pool
  linkedGenerationKeys: string[];
  createdAt: number;
  updatedAt: number;
};
