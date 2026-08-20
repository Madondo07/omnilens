import { generateText, Output } from "ai";
import { z } from "zod";
import { gateway, CHAT_MODEL } from "./ai-gateway.server";
import { posterOutputSchema } from "./omnilens.schemas";

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
      "Also rank the five preset lenses by how relevant this document's content is to each audience. " +
      "Also write a short title (3-6 words, title case, no trailing punctuation) that names what this document is actually about — " +
      "like a notebook title, e.g. 'Event Management System Roadmap' or 'Q3 Marketing Budget Review'. Never just restate the filename.",
    output: Output.object({
      schema: z.object({
        title: z.string().max(60),
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
    prompt: `Document filename: ${input.filename}\n\n---\n${clip(input.content)}\n---\n\nTitle this document, extract claims, and rank lenses.`,
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
      (s) => `SOURCE: ${s.filename}\n` + s.claims.map((c) => `- [${c.type}] ${c.text}`).join("\n"),
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
  appContext?:
    | {
        activeGeneration: {
          title: string;
          lens: string;
          isCustom: boolean;
          completenessScore: number;
          completenessNote: string;
          sectionHeadings: string[];
        } | null;
      }
    | undefined;
}) {
  const g = gateway();
  const corpus = input.sources
    .map((s) => `### SOURCE: ${s.filename}\n${clip(s.content, 9000)}`)
    .join("\n\n");

  const gen = input.appContext?.activeGeneration;
  const appNote = gen
    ? `\n\nThe user is currently looking at a generated poster in the app (not a source document): ` +
      `titled "${gen.title}", framed through the ${gen.isCustom ? `custom lens "${gen.lens}"` : `${gen.lens} lens`}, ` +
      `with sections: ${gen.sectionHeadings.join(", ")}. ` +
      `Its completeness/coverage score is ${gen.completenessScore}% — this is OmniLens's own self-assessment of how well the uploaded sources cover what this lens needs, not a fact from the sources. ` +
      `Why it isn't 100%: ${gen.completenessNote} ` +
      `If asked about "coverage", "completeness", this score, or how to improve it, explain what the score means and give concrete, actionable steps ` +
      `(e.g. specific documents or details to upload) to raise it toward 100% — don't say the sources don't mention it, since it's an app feature, not source content.`
    : "";

  const { text } = await generateText({
    model: g(CHAT_MODEL),
    system:
      "You are OmniLens, a source-grounded project intelligence assistant embedded in the OmniLens app. " +
      "Answer questions about the uploaded sources ONLY from those sources, citing filenames inline like (filename.md). " +
      "If the sources don't cover a factual question, say so plainly. " +
      "You may ALSO answer questions about the app itself — its features, and what the user is currently seeing on screen (like a generated poster's " +
      "completeness score) — using the app context provided below when present; that context describes the app's own output, not a claim to verify against sources. " +
      "Be concise. Write in plain text only — no markdown syntax (no **bold**, no # headings, no markdown bullet lists). Use line breaks and dashes for lists if needed." +
      appNote,
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
  conflicts: {
    claimA: string;
    sourceA: string;
    claimB: string;
    sourceB: string;
    explanation: string;
  }[];
}) {
  const g = gateway();
  const corpus = input.sources
    .map((s) => `### SOURCE: ${s.filename}\n${clip(s.content, 9000)}`)
    .join("\n\n");

  const conflictNote = input.conflicts.length
    ? `Unresolved conflicts (do NOT silently pick a side — call out the ambiguity in a Risks bullet):\n` +
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
      "Use only facts present in the sources. " +
      "Write a proper document title (4-8 words, title case, describing what the poster is about) — " +
      "never restate the lens name or quote the user's framing instructions verbatim as the title. " +
      "Output the poster as structured prose SECTIONS — each section has a heading and bullet points. " +
      'Use these standard sections: "Key Metrics", "Targets", "Risks", "Owners", and optionally "Summary" or other relevant headings. ' +
      "Produce 4-7 sections with 2-5 bullet points each. " +
      "The brief is 2-4 sentences written for the lens audience. " +
      "Also provide a completenessScore (0-100) indicating how well the sources cover this lens, " +
      "and a completenessNote explaining specifically what's thin or missing — concrete enough that the user knows what kind of document or detail to add to raise the score.",
    output: Output.object({
      schema: posterOutputSchema,
    }),
    prompt: `${framing}\n\n${conflictNote}\n\nSources:\n\n${corpus}`,
  });
  return output;
}
