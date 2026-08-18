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

export type Generation = {
  key: string; // `${lens}::${artifactType}::${sourceSetHash}`
  lens: string;
  isCustom: boolean;
  artifactType: "executive-poster";
  sourceSetHash: string;
  createdAt: number;
  brief: string;
  rows: { metric: string; target: string; risk: string; owner: string }[];
  unresolvedConflictCount: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[] | undefined;
  pending?: boolean | undefined;
};
