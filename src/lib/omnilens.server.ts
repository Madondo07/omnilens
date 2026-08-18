import { generateText, Output } from "ai";
import { z } from "zod";
import { gateway, CHAT_MODEL } from "./ai-gateway.server";

const PRESETS = [
  "Executive",
  "IT/Engineering",
  "HR/People Ops",
  "Sales/GTM",
  "Support/Operations",
] as const;

function clip(text: string, max = 12000) {
  return text.length > max ? text.slice(0, max) + "\n...[truncated]" : text;
}

export async function analyzeSourceImpl(input: { filename: string; content: string }) {
  const g = gateway();
  const { output } = await generateText({
    model: g(CHAT_MODEL),
    system:
      "You are a meticulous research analyst. Extract concrete, checkable claims from project documents. " +
      "A claim must be a short factual statement containing a date, a budget/number, a named technology or architecture decision, or a scope commitment. " +
      "Also rank the five preset lenses by how relevant this document's content is to each audience.",
    output: Output.object({
      schema: z.object({
        claims: z
          .array(
            z.object({
              text: z.string(),
              type: z.enum(["date", "budget", "architecture", "scope"]),
              excerpt: z.string().optional(),
            }),
          )
          .max(40),
        lensRanking: z
          .array(
            z.object({
              lens: z.enum(PRESETS),
              score: z.number().min(0).max(100),
              reason: z.string(),
            }),
          )
          .length(5),
      }),
    }),
    prompt: `Document filename: ${input.filename}\n\n---\n${clip(input.content)}\n---\n\nExtract claims and rank lenses.`,
  });
  return output;
}

export async function detectConflictsImpl(input: {
  sources: { filename: string; claims: { text: string; type: string }[] }[];
}) {
  if (input.sources.length < 2) return { conflicts: [] };
  const g = gateway();
  const pool = input.sources
    .map(
      (s) =>
        `SOURCE: ${s.filename}\n` + s.claims.map((c) => `- [${c.type}] ${c.text}`).join("\n"),
    )
    .join("\n\n");

  const { output } = await generateText({
    model: g(CHAT_MODEL),
    system:
      "You detect HARD contradictions only across a shared claim pool: directly incompatible dates, incompatible numbers/budgets, or mutually exclusive named technologies/architecture decisions, or directly opposed scope commitments. " +
      "Never report soft, stylistic, or merely different-emphasis differences. If nothing is hard-contradictory, return an empty array. Claims must come from two DIFFERENT sources.",
    output: Output.object({
      schema: z.object({
        conflicts: z
          .array(
            z.object({
              type: z.enum(["date", "budget", "architecture", "scope"]),
              claimA: z.string(),
              sourceA: z.string(),
              claimB: z.string(),
              sourceB: z.string(),
              explanation: z.string(),
            }),
          )
          .max(20),
      }),
    }),
    prompt: `Shared claim pool:\n\n${clip(pool)}\n\nList hard conflicts.`,
  });
  return output;
}

export async function chatQueryImpl(input: {
  question: string;
  sources: { filename: string; content: string }[];
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const g = gateway();
  const corpus = input.sources
    .map((s) => `### SOURCE: ${s.filename}\n${clip(s.content, 9000)}`)
    .join("\n\n");

  const { text } = await generateText({
    model: g(CHAT_MODEL),
    system:
      "You are OmniLens, a source-grounded project intelligence assistant. Answer ONLY from the provided sources. " +
      "Cite filenames inline like (filename.md). If the sources don't cover it, say so plainly. Be concise, use short markdown.",
    messages: [
      ...input.history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: `Sources:\n\n${corpus}\n\nQuestion: ${input.question}`,
      },
    ],
  });
  return { answer: text };
}

export async function generatePosterImpl(input: {
  lens: string;
  isCustom: boolean;
  sources: { filename: string; content: string }[];
  conflicts: { claimA: string; sourceA: string; claimB: string; sourceB: string; explanation: string }[];
}) {
  const g = gateway();
  const corpus = input.sources
    .map((s) => `### SOURCE: ${s.filename}\n${clip(s.content, 9000)}`)
    .join("\n\n");

  const conflictNote = input.conflicts.length
    ? `Unresolved conflicts (do NOT silently pick a side — mention the ambiguity in the relevant Risk cell):\n` +
      input.conflicts
        .map(
          (c) =>
            `- ${c.explanation} ("${c.claimA}" in ${c.sourceA} vs "${c.claimB}" in ${c.sourceB})`,
        )
        .join("\n")
    : "No unresolved conflicts.";

  const framing = input.isCustom
    ? `Custom lens framing provided by the user (where they are taking this document): "${input.lens}"`
    : `Preset lens: ${input.lens}`;

  const { output } = await generateText({
    model: g(CHAT_MODEL),
    system:
      "You generate a 1-Page Executive Poster from source documents, framed for a specific lens/audience. " +
      "Use only facts present in the sources. Produce 4-7 rows. Each row: a Metric, its Target, a Risk, and an Owner (use 'Unassigned' if no owner appears in sources). " +
      "The brief is 2-4 sentences written for the lens audience.",
    output: Output.object({
      schema: z.object({
        brief: z.string(),
        rows: z
          .array(
            z.object({
              metric: z.string(),
              target: z.string(),
              risk: z.string(),
              owner: z.string(),
            }),
          )
          .min(1)
          .max(8),
      }),
    }),
    prompt: `${framing}\n\n${conflictNote}\n\nSources:\n\n${corpus}`,
  });
  return output;
}
